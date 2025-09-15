import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { authenticateAPI, requireAdmin } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import mongoose from 'mongoose';
import { validateQuestionsExcel } from '../../../../utils/excel';
import fs from 'fs';
import { promisify } from 'util';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const readFileAsync = promisify(fs.readFile);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only POST method is allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID',
        errors: [
          {
            row: 0,
            errors: ['The exam ID is not valid. Please try again.'],
          },
        ],
      });
    }

    // Check if exam exists
    const exam = await mongooseUtils.findById(Exam, id as string);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        errors: [
          {
            row: 0,
            errors: ['The specified exam could not be found.'],
          },
        ],
      });
    }

    // Parse form data
    const form = new IncomingForm({
      keepExtensions: true,
    });
    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Check if file exists
    if (!files || !files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload an Excel file with question data.',
        errors: [
          {
            row: 0,
            errors: ['No file was uploaded. Please select an Excel file.'],
            cells: [{ cell: 'A1', message: 'No file uploaded' }],
          },
        ],
      });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    // Check file type (basic validation)
    if (
      !uploadedFile.mimetype.includes('spreadsheet') &&
      !uploadedFile.mimetype.includes('excel') &&
      !uploadedFile.originalFilename.endsWith('.xlsx')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload an Excel (.xlsx) file.',
        errors: [
          {
            row: 0,
            errors: [
              `Invalid file type: ${uploadedFile.mimetype}. Please upload an Excel (.xlsx) file.`,
            ],
            cells: [{ cell: 'A1', message: 'Invalid file format' }],
          },
        ],
      });
    }

    // Read file
    const fileBuffer = await readFileAsync(uploadedFile.filepath);

    // Validate question data
    const validationResult = validateQuestionsExcel(fileBuffer);

    // If validation failed, return errors
    if (!validationResult.valid || !validationResult.data) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please fix the errors and try again.',
        errors: validationResult.errors,
      });
    }

    // At this point, data is valid and ready to be processed
    // We return the validated data for preview in the frontend
    // The actual saving will happen when the user confirms

    return res.status(200).json({
      success: true,
      message: 'Excel file validated successfully.',
      questions: validationResult.data,
      examId: id,
    });
  } catch (error) {
    console.error('Error uploading questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      errors: [
        {
          row: 0,
          errors: [
            (error as Error).message || 'An unexpected error occurred during file processing.',
          ],
        },
      ],
    });
  }
}

// Apply authentication middleware
export default authenticateAPI(requireAdmin(handler));
