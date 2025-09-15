import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Batch from '../../../models/Batch';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  // GET - Fetch student profile
  if (req.method === 'GET') {
    try {
      // Set caching headers to reduce frequent API calls
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

      // Get student details with populated batch
      const student = await User.findById(req.user.userId).select('-password');

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // If student has a batch, fetch batch details
      let batchDetails = null;
      if (student.batch) {
        batchDetails = await Batch.findById(student.batch);
      }

      // Format the response with all needed information
      const studentProfile = {
        _id: student._id,
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        rollNumber: student.rollNumber,
        mobile: student.mobile,
        dateOfBirth: student.dateOfBirth,
        createdAt: student.createdAt,
        studentDetails: (student as any).studentDetails || {},
        batch: batchDetails
          ? {
              _id: batchDetails._id,
              name: batchDetails.name,
              description: batchDetails.description,
              year: batchDetails.year,
              isActive: batchDetails.isActive,
            }
          : null,
      };

      return res.status(200).json({
        success: true,
        student: studentProfile,
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
