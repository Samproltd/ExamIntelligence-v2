import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Exam, { IExam } from '../../../models/Exam';
import Payment from '../../../models/Payment';
import mongoose from 'mongoose';
import { createOrder } from '../../../utils/razorpay';
import Course from '@/models/Course';
import * as mongooseUtils from '../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can create payment orders
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can create payment orders',
      });
    }

    const { examId, paymentType } = req.body;

    // Validate inputs
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    if (!paymentType || !['suspended', 'max_attempts'].includes(paymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    // Fetch the exam to get details
    const exam = await mongooseUtils.findById(Exam, examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Determine amount based on payment type
    const amount = paymentType === 'suspended' ? 300 : 500; // ₹300 for suspension, ₹500 for max attempts
    // const amount = 1; // ₹300 for suspension, ₹500 for max attempts

    // Create Razorpay order using the utility function
    // Generate a shorter receipt (must be under 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Use only last 8 digits of timestamp
    const shortExamId = examId.toString().slice(-6); // Use last 6 chars of exam ID
    const shortUserId = req.user.userId.toString().slice(-6); // Use last 6 chars of user ID
    const receipt = `e${shortExamId}_u${shortUserId}_${timestamp}`;

    const notes = {
      examId,
      studentId: req.user.userId,
      paymentType,
    };

    const order = await createOrder(amount, 'INR', receipt, notes);

    // Create the payment record in our database
    const payment = await mongooseUtils.create(Payment, {
      student: req.user.userId,
      exam: examId,
      amount,
      paymentType,
      razorpayOrderId: order.id,
      status: 'created',
    });

    return res.status(200).json({
      success: true,
      data: {
        id: payment._id,
        orderId: order.id,
        amount: amount,
        currency: 'INR',
        examName: exam.name,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
