import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Exam from '../../../models/Exam';
import Result from '../../../models/Result';
import User from '../../../models/User';
import Payment from '../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { studentId, examId } = req.query;

    // Validate inputs
    if (!studentId || !mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    if (!examId || !mongoose.Types.ObjectId.isValid(String(examId))) {
      return res.status(400).json({ success: false, message: 'Invalid exam ID' });
    }

    // Convert IDs to strings for consistency
    const studentIdString = String(studentId);
    const examIdString = String(examId);

    // Fetch the student to get batch info
    const student = await mongooseUtils.findById(User, studentIdString, {
      populate: { path: 'batch' },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch the exam to get default max attempts
    const exam = await mongooseUtils.findById(Exam, examIdString);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get results for this student and exam
    const results = await mongooseUtils.find(Result, {
      student: studentIdString,
      exam: examIdString,
      fromPreviousPaymentCycle: { $ne: true }, // Only count current payment cycle attempts
    });

    // Get all successful payments for additional attempts
    const successfulPayments = await mongooseUtils.find(Payment, {
      student: studentIdString,
      exam: examIdString,
      status: 'success',
      paymentType: 'max_attempts',
    });

    // Calculate cumulative additional attempts from all payments
    const additionalAttempts = successfulPayments.reduce((total, payment) => {
      return total + (payment.additionalAttempts || 0);
    }, 0);

    // Get the max attempts based on the logic in the system
    // First check if batch has max attempts defined, fallback to exam setting
    const batchMaxAttempts =
      student.batch && 'maxAttempts' in student.batch
        ? student.batch.maxAttempts
        : exam.maxAttempts || 3;

    // Total max attempts is batch max + any additional purchased
    const totalMaxAttempts = batchMaxAttempts + additionalAttempts;

    // Calculate used attempts
    const usedAttempts = results.length;

    // Return the calculated values
    return res.status(200).json({
      success: true,
      data: {
        studentId: studentIdString,
        examId: examIdString,
        defaultMaxAttempts: exam.maxAttempts,
        batchMaxAttempts,
        additionalAttempts,
        totalMaxAttempts,
        usedAttempts,
        remainingAttempts: Math.max(0, totalMaxAttempts - usedAttempts),
      },
    });
  } catch (error) {
    console.error('Error calculating attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate attempts',
      error: (error as Error).message,
    });
  }
}

export default authenticateAPI(handler);
