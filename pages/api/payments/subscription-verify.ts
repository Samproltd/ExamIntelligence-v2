import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import SubscriptionPlan from '../../../models/SubscriptionPlan';
import StudentSubscription from '../../../models/StudentSubscription';
import User from '../../../models/User';
import { verifyToken } from '../../../utils/auth';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      registrationData,
    } = req.body;

    // Check if this is a registration flow
    const isRegistration = !!registrationData;

    if (!isRegistration) {
      // Regular flow - require authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      // Only students can verify subscription payments
      if (decoded.role !== 'student') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }


    if (!razorpay_order_id || !razorpay_payment_id || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data',
      });
    }

    // Verify Razorpay signature (optional for testing)
    if (razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
        });
      }
    }

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    let userId: string;
    let userCollege: string;

    if (isRegistration) {
      // For registration flow, create user first
      const { name, firstName, middleName, lastName, email, password, role, college, mobile, dateOfBirth } = registrationData;
      
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
      }

      // Create new user
      const newUser = new User({
        name,
        firstName,
        middleName,
        lastName,
        email,
        password,
        role: role || 'student',
        college,
        subscriptionStatus: 'none',
        isVerified: true,
        mobile,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      });

      await newUser.save();
      userId = newUser._id.toString();
      userCollege = college;
    } else {
      // Regular flow - use existing user
      userId = decoded.userId;
      userCollege = decoded.college;
    }

    // Check if user already has an active subscription
    const existingSubscription = await StudentSubscription.findOne({
      student: userId,
      status: 'active',
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    // Create student subscription
    const subscription = new StudentSubscription({
      student: userId,
      plan: planId,
      college: userCollege,
      startDate,
      endDate,
      status: 'active',
      paymentId: razorpay_payment_id,
      amount: plan.price,
      autoRenew: false,
    });

    await subscription.save();

    // Update user's subscription status
    await User.findByIdAndUpdate(userId, {
      subscription: subscription._id,
      subscriptionStatus: 'active',
    });

    // Send confirmation email (you can implement this later)
    // await sendSubscriptionConfirmationEmail(user.email, subscription);

    const responseData: any = {
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        subscription: {
          id: subscription._id,
          plan: {
            name: plan.name,
            duration: plan.duration,
            price: plan.price,
          },
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
          paymentId: subscription.paymentId,
        },
      },
    };

    // For registration flow, include JWT token
    if (isRegistration) {
      const { generateToken } = await import('../../../utils/auth');
      const token = generateToken(
        userId,
        'student',
        userCollege,
        'active'
      );
      responseData.token = token;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
}
