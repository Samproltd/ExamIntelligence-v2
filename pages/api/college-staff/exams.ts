import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import Exam from '../../../models/Exam';
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

    // Only college_staff can access this endpoint
    if (decoded.role !== 'college_staff') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const collegeId = decoded.college;

    // Get all exams in this college (view-only access)
    const exams = await Exam.find({
      college: collegeId
    })
    .populate('subject', 'name')
    .populate('course', 'name')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error('Get college exams error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
}
