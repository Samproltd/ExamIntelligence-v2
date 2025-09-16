import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import { verifyToken } from '../../../../utils/auth';

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
  // For other requests, require student authentication
  if (req.method !== 'GET') {
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Only students can manage subscriptions
    if (decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid plan ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSubscriptionPlan(req, res, id, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Student subscription plan API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getSubscriptionPlan(req: NextApiRequest, res: NextApiResponse, planId: string, decoded: any) {
  try {
    const plan = await SubscriptionPlan.findById(planId)
      .populate('college', 'name code')
      .populate('createdBy', 'name email');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ success: false, message: 'Subscription plan is not active' });
    }

    // For authenticated requests, check if user can access this plan
    if (decoded && decoded.role === 'student') {
      // Students can only view plans for their college
      if (plan.college._id.toString() !== decoded.college) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription plan' });
  }
}
