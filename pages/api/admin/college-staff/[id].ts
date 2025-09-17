import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import User from '../../../../models/User';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid staff ID' });
  }

  if (req.method === 'GET') {
    return handleGetStaff(req, res, id);
  } else if (req.method === 'PUT') {
    return handleUpdateStaff(req, res, id);
  } else if (req.method === 'DELETE') {
    return handleDeleteStaff(req, res, id);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function handleGetStaff(req: NextApiRequest, res: NextApiResponse, staffId: string) {
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

    // Only admin can view staff details
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const staff = await User.findOne({
      _id: staffId,
      role: { $in: ['college_admin', 'college_staff'] }
    })
    .populate('college', 'name code')
    .select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff member' });
  }
}

async function handleUpdateStaff(req: NextApiRequest, res: NextApiResponse, staffId: string) {
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

    // Only admin can update staff
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, email, password, role, college } = req.body;

    // Find the staff member
    const staff = await User.findOne({
      _id: staffId,
      role: { $in: ['college_admin', 'college_staff'] }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== staff.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: staffId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user',
        });
      }
    }

    // Validate role if provided
    if (role && !['college_admin', 'college_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be college_admin or college_staff',
      });
    }

    // Update staff member
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (college) updateData.college = college;

    const updatedStaff = await User.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('college', 'name code')
    .select('-password');

    return res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff,
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff member' });
  }
}

async function handleDeleteStaff(req: NextApiRequest, res: NextApiResponse, staffId: string) {
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

    // Only admin can delete staff
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find the staff member
    const staff = await User.findOne({
      _id: staffId,
      role: { $in: ['college_admin', 'college_staff'] }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Delete the staff member
    await User.findByIdAndDelete(staffId);

    return res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff member' });
  }
}
