import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import { verifyToken } from '../../../../utils/auth';

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

  // Only admins can manage subscription plans
  if (!['admin', 'college_admin'].includes(decoded.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSubscriptionPlans(req, res, decoded);
      case 'POST':
        return await createSubscriptionPlan(req, res, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subscription plans API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getSubscriptionPlans(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // College admins can only see their college's plans
    if (decoded.role === 'college_admin') {
      query.college = decoded.college;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const plans = await SubscriptionPlan.find(query)
      .populate('createdBy', 'name email')
      .populate('college', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SubscriptionPlan.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: plans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription plans' });
  }
}

async function createSubscriptionPlan(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const {
      name,
      description,
      duration,
      price,
      features,
      isActive = true,
      isDefault = false,
      college,
    } = req.body;

    // Validate required fields
    if (!name || !description || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate duration and price
    if (duration < 1 || duration > 999) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 999 months',
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    // College admins can only create plans for their college
    const planCollege = decoded.role === 'college_admin' ? decoded.college : college;

    // If setting as default, unset other default plans for the same college
    if (isDefault) {
      await SubscriptionPlan.updateMany(
        { college: planCollege, isDefault: true },
        { isDefault: false }
      );
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      duration,
      price,
      features: features || [],
      isActive,
      isDefault,
      college: planCollege,
      createdBy: decoded.userId,
    });

    await plan.save();

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create subscription plan' });
  }
}
