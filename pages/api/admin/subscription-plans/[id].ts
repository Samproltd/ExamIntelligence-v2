import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../../utils/db';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid plan ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSubscriptionPlan(req, res, id, decoded);
      case 'PUT':
        return await updateSubscriptionPlan(req, res, id, decoded);
      case 'DELETE':
        return await deleteSubscriptionPlan(req, res, id, decoded);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subscription plan API error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getSubscriptionPlan(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    const plan = await SubscriptionPlan.findById(id)
      .populate('createdBy', 'name email')
      .populate('colleges', 'name code');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // College admins can only access plans available for their college
    if (decoded.role === 'college_admin' && !plan.colleges?.includes(decoded.college)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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

async function updateSubscriptionPlan(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // College admins can only update plans available for their college
    if (decoded.role === 'college_admin' && !plan.colleges?.includes(decoded.college)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      name,
      description,
      duration,
      price,
      features,
      isActive,
      isDefault,
      colleges,
    } = req.body;

    // Validate duration and price if provided
    if (duration !== undefined && (duration < 1 || duration > 999)) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 999 months',
      });
    }

    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
      });
    }

    // If setting as default, unset other default plans for the same colleges
    if (isDefault && !plan.isDefault) {
      const targetColleges = colleges || plan.colleges;
      await SubscriptionPlan.updateMany(
        { colleges: { $in: targetColleges }, isDefault: true },
        { isDefault: false }
      );
    }

    // Update fields
    if (name) plan.name = name;
    if (description) plan.description = description;
    if (duration) plan.duration = duration;
    if (price !== undefined) plan.price = price;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    if (isDefault !== undefined) plan.isDefault = isDefault;
    if (colleges) plan.colleges = colleges;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update subscription plan' });
  }
}

async function deleteSubscriptionPlan(req: NextApiRequest, res: NextApiResponse, id: string, decoded: any) {
  try {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // College admins can only delete plans available for their college
    if (decoded.role === 'college_admin' && !plan.colleges?.includes(decoded.college)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if plan has active subscriptions
    const StudentSubscription = (await import('../../../models/StudentSubscription')).default;
    const activeSubscriptions = await StudentSubscription.countDocuments({
      plan: id,
      status: 'active',
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscriptions',
      });
    }

    await SubscriptionPlan.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully',
    });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete subscription plan' });
  }
}
