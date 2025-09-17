import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import College from '../../../../models/College';
import Subject from '../../../../models/Subject';
import Course from '../../../../models/Course';
import Exam from '../../../../models/Exam';
import Batch from '../../../../models/Batch';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
import User from '../../../../models/User';
import { verifyToken } from '../../../../utils/auth';

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

    // Only admin can access this endpoint
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get counts for all management entities
    const [
      totalColleges,
      totalSubjects,
      totalCourses,
      totalExams,
      totalBatches,
      totalSubscriptionPlans,
      totalBatchAssignments,
      totalStudents
    ] = await Promise.all([
      College.countDocuments(),
      Subject.countDocuments(),
      Course.countDocuments(),
      Exam.countDocuments(),
      Batch.countDocuments(),
      SubscriptionPlan.countDocuments(),
      BatchSubscriptionAssignment.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student' })
    ]);

    const stats = {
      totalColleges,
      totalSubjects,
      totalCourses,
      totalExams,
      totalBatches,
      totalSubscriptionPlans,
      totalBatchAssignments,
      totalStudents
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get management stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch management stats' });
  }
}
