import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import User from '../../../../models/User';
import College from '../../../../models/College';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetStaff(req, res);
  } else if (req.method === 'POST') {
    return handleCreateStaff(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function handleGetStaff(req: NextApiRequest, res: NextApiResponse) {
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

    // Only admin can view all college staff
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const staff = await User.find({
      role: { $in: ['college_admin', 'college_staff'] }
    })
    .populate('college', 'name code')
    .select('-password')
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get college staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch college staff' });
  }
}

async function handleCreateStaff(req: NextApiRequest, res: NextApiResponse) {
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

    // Only admin can create college staff
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, email, password, role, college } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !college) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate role
    if (!['college_admin', 'college_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be college_admin or college_staff',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Verify college exists
    const collegeExists = await College.findById(college);
    if (!collegeExists) {
      return res.status(400).json({
        success: false,
        message: 'College not found',
      });
    }

    // Create new staff member
    const newStaff = new User({
      name,
      email,
      password,
      role,
      college,
      isVerified: true, // Auto-verify staff members created by admin
      subscriptionStatus: 'none', // Staff don't need subscriptions
    });

    await newStaff.save();

    // Return staff without password
    const staffData = await User.findById(newStaff._id)
      .populate('college', 'name code')
      .select('-password');

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staffData,
    });
  } catch (error) {
    console.error('Create college staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff member' });
  }
}
