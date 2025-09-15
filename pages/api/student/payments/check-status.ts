import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Payment from '../../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can check their payment status
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can check their payment status',
      });
    }

    const { examId } = req.query;

    // Validate inputs
    if (!examId || !mongoose.Types.ObjectId.isValid(String(examId))) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    // Find all payments for this student and exam
    const payments = await mongooseUtils.find(
      Payment,
      {
        student: req.user.userId,
        exam: examId,
      },
      null,
      { sort: { createdAt: -1 } }
    ); // Get most recent first

    // Group by payment type
    const maxAttemptsPayments = payments.filter(p => p.paymentType === 'max_attempts');
    const suspendedPayments = payments.filter(p => p.paymentType === 'suspended');

    // Get successful payments
    const successfulMaxAttemptsPayments = maxAttemptsPayments.filter(p => p.status === 'success');

    return res.status(200).json({
      success: true,
      data: {
        allPayments: payments.map(p => ({
          id: p._id,
          status: p.status,
          paymentType: p.paymentType,
          createdAt: p.createdAt,
          additionalAttempts: p.additionalAttempts,
          additionalAttemptsGranted: p.additionalAttemptsGranted,
          additionalAttemptsGrantedAt: p.additionalAttemptsGrantedAt,
        })),
        maxAttemptsPaymentsCount: maxAttemptsPayments.length,
        suspendedPaymentsCount: suspendedPayments.length,
        successfulMaxAttemptsCount: successfulMaxAttemptsPayments.length,
        hasSuccessfulMaxAttemptsPayment: successfulMaxAttemptsPayments.length > 0,
        latestSuccessfulPayment: successfulMaxAttemptsPayments[0]
          ? {
              id: successfulMaxAttemptsPayments[0]._id,
              additionalAttempts: successfulMaxAttemptsPayments[0].additionalAttempts,
              additionalAttemptsGranted: successfulMaxAttemptsPayments[0].additionalAttemptsGranted,
              createdAt: successfulMaxAttemptsPayments[0].createdAt,
            }
          : null,
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
