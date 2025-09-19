import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import User from '../../../../models/User';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import StudentSubscription from '../../../../models/StudentSubscription';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
import Payment from '../../../../models/Payment';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    if (req.method === 'POST') {
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID is required'
        });
      }

      // Get student
      const student = await User.findById(req.user.userId);
      if (!student || !student.batch) {
        return res.status(400).json({
          success: false,
          message: 'Student not found or not assigned to any batch'
        });
      }

      // Check if student already has an active subscription
      const existingSubscription = await StudentSubscription.findOne({
        student: req.user.userId,
        status: 'active'
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
      }

      // Verify the plan is assigned to student's batch
      const batchAssignment = await BatchSubscriptionAssignment.findOne({
        batch: student.batch,
        subscriptionPlan: planId,
        isActive: true
      });

      if (!batchAssignment) {
        return res.status(400).json({
          success: false,
          message: 'This plan is not available for your batch'
        });
      }

      // Get the subscription plan
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan || !plan.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive subscription plan'
        });
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      // Create subscription record
      const subscription = new StudentSubscription({
        student: req.user.userId,
        plan: planId,
        startDate,
        endDate,
        status: 'pending', // Will be activated after payment
        paymentStatus: 'pending'
      });

      await subscription.save();

      // Create payment record
      const payment = new Payment({
        student: req.user.userId,
        subscription: subscription._id,
        amount: plan.price,
        status: 'pending',
        paymentMethod: 'online', // Default to online payment
        description: `Subscription to ${plan.name}`
      });

      await payment.save();

      // In a real application, you would integrate with a payment gateway here
      // For now, we'll simulate a successful payment and activate the subscription
      
      // Simulate payment success (remove this in production)
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();

      subscription.status = 'active';
      subscription.paymentStatus = 'completed';
      await subscription.save();

      return res.status(200).json({
        success: true,
        message: 'Subscription created successfully',
        subscription: {
          id: subscription._id,
          plan: plan.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status
        }
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in student subscribe API:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export default authenticateAPI(handler);
