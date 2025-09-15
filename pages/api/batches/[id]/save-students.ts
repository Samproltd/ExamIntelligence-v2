import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI, requireAdmin } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import User from '../../../../models/User';
import Batch from '../../../../models/Batch';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

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
      return res.status(400).json({ success: false, message: 'Invalid batch ID' });
    }

    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Get student data from request body
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student data provided',
      });
    }

    // Process student data
    const processedStudents = students.map(student => {
      // Ensure name is properly formatted for compatibility with login
      const firstName = student.firstName || '';
      const lastName = student.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        name: fullName, // Ensure the name field is properly set
        firstName: firstName,
        lastName: lastName,
        email: student.email.toLowerCase().trim(), // Ensure email is lowercase and trimmed
        password: student.password, // Store plain password, let Mongoose middleware handle hashing
        role: 'student',
        batch: new mongoose.Types.ObjectId(id as string),
        ...(student.rollNumber ? { rollNumber: student.rollNumber } : {}),
        ...(student.mobile ? { mobile: student.mobile } : {}),
        ...(student.dateOfBirth ? { dateOfBirth: new Date(student.dateOfBirth) } : {}),
      };
    });

    // Create students using the User model directly to ensure hooks are triggered
    const createdStudents = await User.create(processedStudents);

    return res.status(200).json({
      success: true,
      message: `Successfully added ${Array.isArray(createdStudents) ? createdStudents.length : 1} students to batch "${batch.name}"`,
      count: Array.isArray(createdStudents) ? createdStudents.length : 1,
    });
  } catch (error) {
    console.error('Error saving students:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
}

// Apply authentication middleware
export default authenticateAPI(requireAdmin(handler));
