import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Result from '../../../../models/Result';
import Payment from '../../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can check their attempts
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can check their attempts',
      });
    }

    const { examId } = req.query;

    // Validate inputs
    if (!examId || !mongoose.Types.ObjectId.isValid(String(examId))) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    // Convert examId to string to ensure type safety
    const examIdString = String(examId);

    // Fetch the exam to get max attempts
    const exam = await mongooseUtils.findById(Exam, examIdString);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get results for this student and exam
    const results = await mongooseUtils.find(Result, {
      student: req.user.userId,
      exam: examIdString,
    });

    // Get all successful payments for this student and exam instead of just the latest one
    const payments = await mongooseUtils.find(Payment, {
      student: req.user.userId,
      exam: examIdString,
      status: 'success',
      paymentType: 'max_attempts',
    });

    // Calculate cumulative additional attempts from all payments
    const additionalAttempts = payments.reduce((total, payment) => {
      return total + (payment.additionalAttempts || 0);
    }, 0);

    // Get the latest payment to determine if they've made any payments
    const latestPayment =
      payments.length > 0
        ? payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;

    // Calculate attempts remaining
    const defaultMaxAttempts = exam.maxAttempts || 3; // Default to 3 if not set
    const totalAttempts = defaultMaxAttempts + additionalAttempts;
    const usedAttempts = results.length;
    const remainingAttempts = Math.max(0, totalAttempts - usedAttempts);

    return res.status(200).json({
      success: true,
      data: {
        examId: examId,
        examName: exam.name,
        defaultMaxAttempts: defaultMaxAttempts,
        additionalAttempts: additionalAttempts,
        totalAttempts: totalAttempts,
        usedAttempts: usedAttempts,
        remainingAttempts: remainingAttempts,
        hasPaidForAdditionalAttempts: payments.length > 0,
        totalPayments: payments.length,
      },
    });
  } catch (error) {
    console.error('Error checking attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check attempts',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
