import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Result from '../../../../models/Result';
import Payment from '../../../../models/Payment';
import Batch from '../../../../models/Batch';
import User from '../../../../models/User';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

interface IExamData {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  course: any;
  maxAttempts: number;
  attemptsMade: number;
  canRetake: boolean;
  totalQuestions: number;
  questionsToDisplay: number;
  passingMarks: number;
  hasPaidForAdditionalAttempts: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Restrict to admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { id } = req.query; // examId
  const { studentId } = req.query; // studentId from query params

  // Validate object IDs
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid exam ID' });
  }
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId as string)) {
    return res.status(400).json({ success: false, message: 'Valid student ID is required' });
  }

  // GET - Fetch exam details for admin
  if (req.method === 'GET') {
    try {
      // Fetch the exam with course and subject info
      const exam = await mongooseUtils.findById(Exam, id as string, {
        populate: {
          path: 'course',
          select: 'name subject',
          populate: {
            path: 'subject',
            select: 'name',
          },
        },
      });

      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Fetch student and their batch
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      if (!student.batch) {
        return res.status(400).json({
          success: false,
          message: 'Student is not assigned to any batch',
        });
      }

      // Get batch details
      const batch = await Batch.findById(student.batch);
      if (!batch) {
        return res.status(400).json({ success: false, message: 'Student batch not found' });
      }

      // Fetch all attempts for this student and exam
      const allAttempts = await mongooseUtils.find(Result, {
        student: studentId,
        exam: id,
        fromPreviousPaymentCycle: { $ne: true }, // Exclude previous payment cycle attempts
      });

      // Fetch successful payments for additional attempts
      const successfulPayments = await mongooseUtils.find(Payment, {
        student: studentId,
        exam: id,
        status: 'success',
        paymentType: 'max_attempts',
      });

      // Calculate cumulative additional attempts from payments
      const additionalAttempts = successfulPayments.reduce((total, payment) => {
        return total + (payment.additionalAttempts || 0);
      }, 0);

      const attemptsMade = allAttempts.length;
      const hasPassed = allAttempts.some(attempt => attempt.passed);
      const batchMaxAttempts = batch.maxAttempts || 3; // Default to 3 if not set
      const totalMaxAttempts = batchMaxAttempts + additionalAttempts;
      const canRetake = attemptsMade < totalMaxAttempts && !hasPassed;

      // Debug logging
      console.log('ADMIN EXAM DETAILS:', {
        examId: id,
        studentId,
        batchMaxAttempts,
        additionalAttempts,
        totalMaxAttempts,
        attemptsMade,
        canRetake,
        totalPayments: successfulPayments.length,
      });

      const examData: IExamData = {
        _id: exam._id,
        name: exam.name,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passPercentage: exam.passPercentage,
        course: exam.course,
        maxAttempts: totalMaxAttempts,
        attemptsMade,
        canRetake,
        totalQuestions: exam.totalQuestions,
        questionsToDisplay: exam.questionsToDisplay,
        passingMarks: exam.totalMarks * (exam.passPercentage / 100),
        hasPaidForAdditionalAttempts: successfulPayments.length > 0,
      };

      return res.status(200).json({
        success: true,
        exam: examData,
      });
    } catch (error) {
      console.error('Error fetching admin exam details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
