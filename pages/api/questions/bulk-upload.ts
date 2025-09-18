import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Question from '../../../models/Question';
import { verifyToken } from '../../../utils/auth';
import multer from 'multer';
import * as XLSX from 'xlsx';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// Middleware to handle file upload
const uploadMiddleware = upload.single('file');

// Helper function to run middleware
const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    await preloadModels();

    // Authenticate user
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Run multer middleware
    await runMiddleware(req, res, uploadMiddleware);

    const { category } = req.body;
    const file = req.file;

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required',
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain at least one question row',
      });
    }

    // Validate headers
    const headers = data[0] as string[];
    const expectedHeaders = ['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Option'];
    
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (!headers[i] || headers[i].trim() !== expectedHeaders[i]) {
        return res.status(400).json({
          success: false,
          message: `Invalid header at column ${i + 1}. Expected: ${expectedHeaders[i]}`,
        });
      }
    }

    const questions = [];
    const errors = [];
    const duplicates = [];

    // Get existing questions to check for duplicates
    const existingQuestions = await (Question as any).find({ category: category.trim() }).exec();
    const existingQuestionTexts = new Set(existingQuestions.map((q: any) => q.text.toLowerCase().trim()));

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      
      try {
        // Validate row data
        if (!row[0] || !row[0].toString().trim()) {
          errors.push(`Row ${i + 1}: Question text is required`);
          continue;
        }

        const questionText = row[0].toString().trim();
        
        // Check for duplicates
        if (existingQuestionTexts.has(questionText.toLowerCase())) {
          duplicates.push(`Row ${i + 1}: Duplicate question found`);
          continue;
        }

        const options = [];
        for (let j = 1; j <= 4; j++) {
          if (!row[j] || !row[j].toString().trim()) {
            errors.push(`Row ${i + 1}: Option ${j} is required`);
            break;
          }
          options.push({
            text: row[j].toString().trim(),
            isCorrect: false,
          });
        }

        if (options.length !== 4) continue;

        // Validate correct option
        const correctOption = parseInt(row[5]);
        if (!correctOption || correctOption < 1 || correctOption > 4) {
          errors.push(`Row ${i + 1}: Correct option must be 1, 2, 3, or 4`);
          continue;
        }

        // Mark correct option
        options[correctOption - 1].isCorrect = true;

        questions.push({
          text: questionText,
          category: category.trim(),
          options,
          createdBy: decoded.userId,
        });

        // Add to existing questions set to prevent duplicates within the same file
        existingQuestionTexts.add(questionText.toLowerCase());
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in the file',
        errors,
        duplicates: duplicates.length,
        total: data.length - 1, // Exclude header row
      });
    }

    // Save questions to database
    const savedQuestions = await Question.insertMany(questions);

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${savedQuestions.length} questions`,
      uploaded: savedQuestions.length,
      duplicates: duplicates.length,
      errors: errors.length,
      total: data.length - 1, // Exclude header row
      errorDetails: errors,
      duplicateDetails: duplicates,
    });
  } catch (error: any) {
    if (error.message === 'Only Excel files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Only Excel files (.xlsx, .xls) are allowed',
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 100MB',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error processing file',
    });
  }
}

export default handler;

// Disable body parsing for this endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};
