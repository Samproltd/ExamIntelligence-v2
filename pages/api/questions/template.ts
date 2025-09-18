import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../utils/auth';
import * as XLSX from 'xlsx';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
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

    // Create sample data
    const data = [
      ['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Option'],
      [
        'What is 2 + 2?',
        '3',
        '4',
        '5',
        '6',
        2
      ],
      [
        'What is the capital of India?',
        'Mumbai',
        'Delhi',
        'Kolkata',
        'Chennai',
        2
      ],
      [
        'Which planet is known as the Red Planet?',
        'Venus',
        'Mars',
        'Jupiter',
        'Saturn',
        2
      ],
      [
        'What is the largest mammal?',
        'Elephant',
        'Blue Whale',
        'Giraffe',
        'Hippopotamus',
        2
      ],
      [
        'Who wrote "Romeo and Juliet"?',
        'Charles Dickens',
        'William Shakespeare',
        'Mark Twain',
        'Jane Austen',
        2
      ]
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const columnWidths = [
      { wch: 50 }, // Question
      { wch: 20 }, // Option 1
      { wch: 20 }, // Option 2
      { wch: 20 }, // Option 3
      { wch: 20 }, // Option 4
      { wch: 15 }  // Correct Option
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="question-template.xlsx"');
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generating template',
    });
  }
}

export default handler;
