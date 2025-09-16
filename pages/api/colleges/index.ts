import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import College from '../../../models/College';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const authHeader = req.headers.authorization;
  let decoded: any = null;

  // Check if authentication is provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  // For GET requests, allow unauthenticated access (for registration flow)
  // For POST/PUT/DELETE requests, require admin authentication
  if (req.method !== 'GET') {
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Only admins can manage colleges
    if (!['admin', 'college_admin'].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getColleges(req, res, decoded);
      case 'POST':
        return await createCollege(req, res, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('College API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getColleges(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = { isActive: true }; // Only show active colleges
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { contactEmail: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // For unauthenticated requests (registration flow), only return basic college info
    if (!decoded) {
      const colleges = await College.find(query, {
        name: 1,
        code: 1,
        address: 1,
        contactEmail: 1,
        isActive: 1,
        branding: 1
      })
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await College.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: colleges,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    }

    // For authenticated requests, return full data with createdBy
    const colleges = await College.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await College.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: colleges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get colleges error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch colleges' });
  }
}

async function createCollege(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    // Only admin can create colleges
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
      settings,
      branding,
    } = req.body;

    // Validate required fields
    if (!name || !code || !address || !contactEmail || !contactPhone || !adminEmail || !adminName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if college code already exists
    const existingCollege = await College.findOne({ code: code.toUpperCase() });
    if (existingCollege) {
      return res.status(400).json({
        success: false,
        message: 'College code already exists',
      });
    }

    const college = new College({
      name,
      code: code.toUpperCase(),
      address,
      contactEmail,
      contactPhone,
      adminEmail,
      adminName,
      maxStudents: maxStudents || 1000,
      createdBy: decoded.userId, // Set the creator
      settings: {
        allowStudentRegistration: settings?.allowStudentRegistration ?? true,
        requireEmailVerification: settings?.requireEmailVerification ?? true,
        enableProctoring: settings?.enableProctoring ?? true,
        enableCertificates: settings?.enableCertificates ?? true,
        allowStudentSubscriptions: settings?.allowStudentSubscriptions ?? true,
      },
      branding: {
        logo: branding?.logo || '',
        primaryColor: branding?.primaryColor || '#3B82F6',
        secondaryColor: branding?.secondaryColor || '#1E40AF',
        customDomain: branding?.customDomain || '',
      },
    });

    await college.save();

    return res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college,
    });
  } catch (error) {
    console.error('Create college error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create college' });
  }
}
