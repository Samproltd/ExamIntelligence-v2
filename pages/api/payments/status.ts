import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Payment from '../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can check payment status
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can check payment status',
      });
    }

    const { examId, paymentType } = req.query;

    // Validate inputs
    if (!examId || !mongoose.Types.ObjectId.isValid(examId as string)) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    if (!paymentType || !['suspended', 'max_attempts'].includes(paymentType as string)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    // Find the most recent payment for this exam and payment type
    const payment = await mongooseUtils.findOne(
      Payment,
      {
        student: req.user.userId,
        exam: examId,
        paymentType: paymentType,
      },
      null,
      {
        sort: { createdAt: -1 },
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: payment._id,
        status: payment.status,
        paymentType: payment.paymentType,
        amount: payment.amount,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        razorpayOrderId: payment.razorpayOrderId,
      },
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
