import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Question from '../../../../models/Question';
import User from '../../../../models/User';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';
import Batch from '../../../../models/Batch';
import Result from '../../../../models/Result';
import Payment from '../../../../models/Payment';
import { validateStudentSubscription } from '../../../../utils/subscriptionValidation';

// Define interfaces for type safety
interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  course: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  assignedBatches?: mongoose.Types.ObjectId[];
  questionsToDisplay: number;
}

interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  batch?: mongoose.Types.ObjectId;
}

interface IQuestion {
  _id: mongoose.Types.ObjectId;
  text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only students can take exams
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can take exams' });
  }

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid exam ID' });
  }

  // GET - Fetch exam and questions for taking the exam
  if (req.method === 'GET') {
    try {
      // Check if exam exists
      const exam = await mongooseUtils.findById<any, IExam>(Exam, id as string, {
        populate: {
          path: 'course',
          select: 'name',
        },
      });

      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Get student's batch
      const student = await mongooseUtils.findById<any, IUser>(User, req.user.userId);
      const studentBatchId = student?.batch;

      if (!studentBatchId) {
        return res.status(400).json({
          success: false,
          message: 'Student is not assigned to any batch',
        });
      }

      // Get batch details
      const batch = await Batch.findById(studentBatchId);
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Student batch not found',
        });
      }

      // Check if this exam is assigned to the student's batch
      if (exam.assignedBatches && exam.assignedBatches.length > 0) {
        // Check if the exam is assigned to this student's batch
        const batchAssigned = exam.assignedBatches.some(
          batch => batch.toString() === studentBatchId.toString()
        );

        if (!batchAssigned) {
          return res.status(403).json({
            success: false,
            message: 'This exam is not assigned to your batch',
          });
        }
      }

      // ✅ ADD: Subscription validation
      const subscriptionValidation = await validateStudentSubscription(req.user.userId, studentBatchId);
      
      if (!subscriptionValidation.valid) {
        return res.status(403).json({
          success: false,
          message: subscriptionValidation.reason,
          subscriptionRequired: subscriptionValidation.subscriptionPlan || null,
          hasActiveSubscription: subscriptionValidation.hasActiveSubscription,
          subscriptionExpired: subscriptionValidation.subscriptionExpired,
          batchNotAssigned: subscriptionValidation.batchNotAssigned
        });
      }

      // Check previous attempts, excluding those from previous payment cycles
      const previousAttempts = await mongooseUtils.find(Result, {
        student: req.user.userId,
        exam: id,
        fromPreviousPaymentCycle: { $ne: true }, // Only count current payment cycle attempts
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

      // Calculate total max attempts including additional ones from all payments
      const totalMaxAttempts = batch.maxAttempts + additionalAttempts;

      const currentAttempt = previousAttempts.length + 1;

      console.log('EXAM TAKE ATTEMPT CHECK:', {
        examId: id,
        studentId: req.user.userId,
        batchMaxAttempts: batch.maxAttempts,
        additionalAttempts,
        totalMaxAttempts,
        currentAttempt,
        previousAttempts: previousAttempts.length,
        totalPayments: successfulPayments.length,
      });

      // Check if max attempts reached based on batch setting + additional attempts
      if (currentAttempt > totalMaxAttempts) {
        return res.status(400).json({
          success: false,
          message: `Maximum attempts (${totalMaxAttempts}) reached for this exam`,
        });
      }

      // Check if already passed
      const hasPassed = previousAttempts.some(attempt => attempt.passed);
      if (hasPassed) {
        return res.status(400).json({
          success: false,
          message: 'You have passed this exam',
        });
      }

      // Fetch questions but don't reveal which option is correct
      const questions = await mongooseUtils.find<any, IQuestion>(
        Question,
        { exam: id },
        '-options.isCorrect'
      );

      // If no questions are found
      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'This exam has no questions yet',
        });
      }

      // Randomly select questionsToDisplay number of questions
      const selectedQuestions = questions
        .sort(() => 0.5 - Math.random())
        .slice(0, exam.questionsToDisplay);

      return res.status(200).json({
        success: true,
        exam: {
          _id: exam._id,
          name: exam.name,
          description: exam.description,
          duration: exam.duration,
          questions: selectedQuestions,
        },
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
