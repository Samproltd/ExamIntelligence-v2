import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../utils/db';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid staff ID' });
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

    // Only admin can toggle block status
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isBlocked must be a boolean value',
      });
    }

    // Find the staff member
    const staff = await User.findOne({
      _id: id,
      role: { $in: ['college_admin', 'college_staff'] }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Update block status
    const updatedStaff = await User.findByIdAndUpdate(
      id,
      { isBlocked },
      { new: true, runValidators: true }
    )
    .populate('college', 'name code')
    .select('-password');

    return res.status(200).json({
      success: true,
      message: `Staff member ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: updatedStaff,
    });
  } catch (error) {
    console.error('Toggle block status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update block status' });
  }
}
