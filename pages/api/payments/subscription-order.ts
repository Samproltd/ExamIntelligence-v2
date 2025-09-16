import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import SubscriptionPlan from '../../../models/SubscriptionPlan';
import { verifyToken } from '../../../utils/auth';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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

    // Only students can create subscription orders
    if (decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { planId, amount, currency = 'INR' } = req.body;

    console.log('Payment order request:', { planId, amount, currency });

    if (!planId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and amount are required',
      });
    }

    // Get subscription plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    if (!plan.isActive) {
      return res.status(400).json({ success: false, message: 'Subscription plan is not active' });
    }

    console.log('Plan details:', { name: plan.name, price: plan.price, receivedAmount: amount });

    // Verify amount matches plan price
    if (amount !== plan.price) {
      return res.status(400).json({
        success: false,
        message: 'Amount does not match plan price',
      });
    }

    // Ensure amount is a valid number
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided',
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise, ensure it's an integer
      currency: currency,
      receipt: `sub_${Date.now()}`, // Shortened receipt (max 40 chars)
      notes: {
        planId: planId,
        userId: decoded.userId,
        planName: plan.name,
        college: decoded.college,
        originalAmount: amount.toString(),
      },
    };

    console.log('Razorpay order options:', orderOptions);

    const order = await razorpay.orders.create(orderOptions);
    
    console.log('Razorpay order created:', { id: order.id, amount: order.amount, currency: order.currency });
    console.log('Order amount in rupees:', order.amount / 100);

    return res.status(200).json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        plan: {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          duration: plan.duration,
          price: plan.price,
          features: plan.features,
        },
      },
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
}
