import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import College from '../../../models/College';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Only admins can manage colleges
  if (!['admin', 'college_admin'].includes(decoded.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid college ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getCollege(req, res, id, decoded);
      case 'PUT':
        return await updateCollege(req, res, id, decoded);
      case 'DELETE':
        return await deleteCollege(req, res, id, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('College API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getCollege(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    const college = await College.findById(id).populate('createdBy', 'name email');

    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    return res.status(200).json({
      success: true,
      data: college,
    });
  } catch (error) {
    console.error('Get college error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch college' });
  }
}

async function updateCollege(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    // Only admin can update colleges
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const {
      name,
      code,
      address,
      contactEmail,
      contactPhone,
      adminEmail,
      adminName,
      maxStudents,
      isActive,
      settings,
      branding,
    } = req.body;

    // Check if code is being changed and if it already exists
    if (code && code !== college.code) {
      const existingCollege = await College.findOne({ code: code.toUpperCase() });
      if (existingCollege) {
        return res.status(400).json({
          success: false,
          message: 'College code already exists',
        });
      }
    }

    // Update fields
    if (name) college.name = name;
    if (code) college.code = code.toUpperCase();
    if (address) college.address = address;
    if (contactEmail) college.contactEmail = contactEmail;
    if (contactPhone) college.contactPhone = contactPhone;
    if (adminEmail) college.adminEmail = adminEmail;
    if (adminName) college.adminName = adminName;
    if (maxStudents !== undefined) college.maxStudents = maxStudents;
    if (isActive !== undefined) college.isActive = isActive;
    if (settings) college.settings = { ...college.settings, ...settings };
    if (branding) college.branding = { ...college.branding, ...branding };

    await college.save();

    return res.status(200).json({
      success: true,
      message: 'College updated successfully',
      data: college,
    });
  } catch (error) {
    console.error('Update college error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update college' });
  }
}

async function deleteCollege(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    // Only admin can delete colleges
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    // Check if college has students
    if (college.currentStudents > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete college with existing students',
      });
    }

    await College.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'College deleted successfully',
    });
  } catch (error) {
    console.error('Delete college error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete college' });
  }
}
