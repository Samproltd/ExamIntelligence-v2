import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI, requireAdmin } from '../../../utils/auth';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { generateStudentTemplate } from '../../../scripts/generate-template';

const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only GET method is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Generate template file
    generateStudentTemplate();

    // File path
    const filePath = path.join(process.cwd(), 'student_import_template.xlsx');

    // Read the file
    const fileBuffer = await readFileAsync(filePath);

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Send the file
    res.send(fileBuffer);

    // Delete the temporary file after sending
    try {
      await unlinkAsync(filePath);
    } catch (error) {
      console.error('Error removing temporary template file:', error);
      // Continue execution even if removal fails
    }
  } catch (error) {
    console.error('Error generating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
}

// Apply authentication middleware
export default authenticateAPI(requireAdmin(handler));
