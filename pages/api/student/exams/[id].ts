import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Question from '../../../../models/Question';
import Result from '../../../../models/Result';
import User from '../../../../models/User';
import Batch from '../../../../models/Batch';
import Payment from '../../../../models/Payment';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

interface IExam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  course: any;
  maxAttempts: number;
  [key: string]: any;
}

interface IExamData extends IExam {
  questionCount: number;
  hasTaken: boolean;
  attemptsMade: number;
  canRetake: boolean;
  totalQuestions: number;
  questionsToDisplay: number;
  passingMarks: number;
  result?: {
    _id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    createdAt: Date;
    attemptNumber: number;
  };
  hasPaidForAdditionalAttempts: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid exam ID' });
  }

  // GET - Fetch exam details for a student
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

      // Get student's batch
      const student = await User.findById(req.user.userId);
      if (!student || !student.batch) {
        return res.status(400).json({
          success: false,
          message: 'Student is not assigned to any batch',
        });
      }

      // Get batch details
      const batch = await Batch.findById(student.batch);
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Student batch not found',
        });
      }

      // Count questions
      const questionCount = await mongooseUtils.countDocuments(Question, {
        exam: id,
      });

      // Check all previous attempts for this student and exam
      const allAttempts = await mongooseUtils.find(Result, {
        student: req.user.userId,
        exam: id,
        fromPreviousPaymentCycle: { $ne: true }, // Only count attempts from current payment cycle
      });

      // Get all successful payments for additional attempts
      const successfulPayments = await mongooseUtils.find(Payment, {
        student: req.user.userId,
        exam: id,
        status: 'success',
        paymentType: 'max_attempts',
      });

      // Calculate cumulative additional attempts from all payments
      const additionalAttempts = successfulPayments.reduce((total, payment) => {
        return total + (payment.additionalAttempts || 0);
      }, 0);

      const attemptsMade = allAttempts.length;
      const hasPassed = allAttempts.some(attempt => attempt.passed);
      const totalMaxAttempts = batch.maxAttempts + additionalAttempts;
      const canRetake = attemptsMade < totalMaxAttempts && !hasPassed;

      const latestAttempt = allAttempts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      // Type assertion to help TypeScript understand Document structure
      const examDoc = exam as unknown as IExam;

      // Debug the batch maxAttempts value
      console.log('BATCH DETAILS FOR STUDENT:', {
        batchId: student.batch,
        batchMaxAttempts: batch.maxAttempts,
        maxAttemptsType: typeof batch.maxAttempts,
        additionalAttempts: additionalAttempts,
        additionalAttemptsAfterPayment: batch.additionalAttemptsAfterPayment,
        totalMaxAttempts: totalMaxAttempts,
        totalPayments: successfulPayments.length,
      });

      const examData: IExamData = {
        _id: examDoc._id,
        name: examDoc.name,
        description: examDoc.description,
        duration: examDoc.duration,
        totalMarks: examDoc.totalMarks,
        passPercentage: examDoc.passPercentage,
        course: examDoc.course,
        maxAttempts: totalMaxAttempts, // Use batch's max attempts + additional attempts
        questionCount,
        hasTaken: attemptsMade > 0, // True if any attempt exists
        attemptsMade: attemptsMade,
        canRetake: canRetake,
        totalQuestions: examDoc.totalQuestions,
        questionsToDisplay: examDoc.questionsToDisplay,
        passingMarks: examDoc.totalMarks * (examDoc.passPercentage / 100),
        hasPaidForAdditionalAttempts: successfulPayments.length > 0,
      };

      // Debug the response data
      console.log('EXAM RESPONSE DATA:', {
        defaultMaxAttempts: batch.maxAttempts,
        additionalAttempts,
        totalMaxAttempts,
        maxAttempts: examData.maxAttempts,
        attemptsMade,
        canRetake,
        totalPayments: successfulPayments.length,
      });

      // If the student has taken the exam, include the result summary of the LATEST attempt
      if (latestAttempt) {
        examData.result = {
          _id: latestAttempt._id.toString(),
          score: latestAttempt.score,
          totalQuestions: latestAttempt.totalQuestions,
          percentage: latestAttempt.percentage,
          passed: latestAttempt.passed,
          createdAt: latestAttempt.createdAt,
          attemptNumber: attemptsMade, // The latest attempt number is simply the total count
        };
      }

      return res.status(200).json({
        success: true,
        exam: examData,
      });
    } catch (error) {
      console.error('Error fetching exam details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
