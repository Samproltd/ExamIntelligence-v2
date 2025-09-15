import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Exam from '../../../models/Exam';
import Result from '../../../models/Result';
import Payment from '../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can reset their attempts after payment
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can reset their attempts',
      });
    }

    const { examId, paymentId } = req.body;

    // Validate inputs
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }

    // Check if payment exists and is successful
    const payment = await mongooseUtils.findById(Payment, paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not successful',
        paymentStatus: payment.status,
      });
    }

    if (payment.student.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only reset attempts for your own payments',
      });
    }

    if (payment.exam.toString() !== examId) {
      return res.status(400).json({
        success: false,
        message: 'Payment is not for this exam',
      });
    }

    if (payment.paymentType !== 'max_attempts') {
      return res.status(400).json({
        success: false,
        message: 'This payment is not for resetting attempts',
      });
    }

    // Fetch the exam
    const exam = await mongooseUtils.findById(Exam, examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get results for this student and exam
    const results = await mongooseUtils.find(Result, {
      student: req.user.userId,
      exam: examId,
    });

    // Mark previous results as from previous payment cycle
    if (results.length > 0) {
      await mongooseUtils.updateMany(
        Result,
        {
          student: req.user.userId,
          exam: examId,
        },
        {
          $set: {
            fromPreviousPaymentCycle: true,
          },
        }
      );
    }

    // Create a record in our custom tracking system (if needed)
    // Here we could add a document to track that this student has 2 additional attempts
    // For this implementation, we'll store this information directly in the payment document

    // Update the payment to indicate 2 additional attempts were granted
    await mongooseUtils.findByIdAndUpdate(Payment, paymentId, {
      $set: {
        additionalAttempts: 2,
        additionalAttemptsGranted: true,
        additionalAttemptsGrantedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'You have received 2 additional exam attempts',
      data: {
        examId: examId,
        paymentId: paymentId,
        maxAttempts: exam.maxAttempts,
        additionalAttempts: 2,
        resetAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error granting additional attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to grant additional attempts',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
