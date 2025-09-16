import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import StudentSubscription from '../../../../models/StudentSubscription';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import User from '../../../../models/User';
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

  // Only students can manage their subscriptions
  if (decoded.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStudentSubscriptions(req, res, decoded);
      case 'POST':
        return await createStudentSubscription(req, res, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Student subscriptions API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getStudentSubscriptions(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const subscriptions = await StudentSubscription.find({
      student: decoded.userId,
    })
      .populate('plan', 'name description duration price features')
      .populate('college', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Get student subscriptions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
}

async function createStudentSubscription(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const { planId, paymentId, amount } = req.body;

    // Validate required fields
    if (!planId || !paymentId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide plan ID, payment ID, and amount',
      });
    }

    // Get the subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // Check if plan is active
    if (!plan.isActive) {
      return res.status(400).json({ success: false, message: 'Subscription plan is not active' });
    }

    // Check if student already has an active subscription
    const existingSubscription = await StudentSubscription.findOne({
      student: decoded.userId,
      status: 'active',
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription',
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    // Create subscription
    const subscription = new StudentSubscription({
      student: decoded.userId,
      plan: planId,
      college: decoded.college,
      startDate,
      endDate,
      status: 'active',
      paymentId,
      amount,
      autoRenew: false,
    });

    await subscription.save();

    // Update user's subscription status
    await User.findByIdAndUpdate(decoded.userId, {
      subscription: subscription._id,
      subscriptionStatus: 'active',
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Create student subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create subscription' });
  }
}
