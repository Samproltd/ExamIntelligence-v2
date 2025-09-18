import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../../utils/db';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

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

  try {
    switch (req.method) {
      case 'GET':
        return await getAvailablePlans(req, res, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Student subscription plans API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getAvailablePlans(req: NextApiRequest, res: NextApiResponse, decoded: any) {
  try {
    const { college } = req.query;

    // For unauthenticated requests (registration flow), use college from query
    // For authenticated requests, use student's college or query college
    const targetCollege = college || (decoded ? decoded.college : null);

    if (!targetCollege) {
      return res.status(400).json({ 
        success: false, 
        message: 'College parameter is required' 
      });
    }

    const plans = await SubscriptionPlan.find({
      colleges: targetCollege,
      isActive: true,
    })
      .populate('colleges', 'name code')
      .sort({ price: 1 }); // Sort by price ascending

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Get available plans error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription plans' });
  }
}
