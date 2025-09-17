import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import Subject from '../../../models/Subject';
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

    // Only college_admin can access this endpoint
    if (decoded.role !== 'college_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const collegeId = decoded.college;

    // Get all subjects assigned to this college (view-only)
    const subjects = await Subject.find({
      college: collegeId
    })
    .populate('college', 'name')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Get college subjects error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
}
