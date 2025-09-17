import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import College from '../../../models/College';
import Exam from '../../../models/Exam';
import Course from '../../../models/Course';
import Subject from '../../../models/Subject';
import Batch from '../../../models/Batch';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Only college_staff can access this dashboard
    if (decoded.role !== 'college_staff') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const collegeId = decoded.college;

    // Get college information
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    // Get dashboard statistics (same as college admin but with view-only access)
    const [
      totalStudents,
      activeStudents,
      totalExams,
      activeExams,
      totalCourses,
      totalSubjects,
      totalBatches,
    ] = await Promise.all([
      // Total students in this college
      User.countDocuments({ 
        role: 'student', 
        college: collegeId 
      }),
      
      // Active students (with active subscriptions)
      User.countDocuments({ 
        role: 'student', 
        college: collegeId,
        subscriptionStatus: 'active'
      }),
      
      // Total exams in this college
      Exam.countDocuments({ college: collegeId }),
      
      // Active exams (currently running)
      Exam.countDocuments({ 
        college: collegeId,
        status: 'active'
      }),
      
      // Total courses in this college
      Course.countDocuments({ college: collegeId }),
      
      // Total subjects in this college
      Subject.countDocuments({ college: collegeId }),
      
      // Total batches in this college
      Batch.countDocuments({ college: collegeId }),
    ]);

    const stats = {
      totalStudents,
      activeStudents,
      totalExams,
      activeExams,
      totalCourses,
      totalSubjects,
      totalBatches,
    };

    return res.status(200).json({
      success: true,
      data: {
        stats,
        college: {
          _id: college._id,
          name: college.name,
          code: college.code,
          address: college.address,
          contactEmail: college.contactEmail,
          contactPhone: college.contactPhone,
          maxStudents: college.maxStudents,
          currentStudents: college.currentStudents,
          isActive: college.isActive,
        },
      },
    });
  } catch (error) {
    console.error('College staff dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
}
