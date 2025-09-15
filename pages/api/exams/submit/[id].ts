import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Question, { IQuestion } from '../../../../models/Question';
import Result, { IResult } from '../../../../models/Result';
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import Batch from '../../../../models/Batch';
import * as mongooseUtils from '../../../../utils/mongooseUtils';
import mongoose from 'mongoose';
import Payment from '../../../../models/Payment';

interface AnswerSubmission {
  questionId: string;
  selectedOption: string;
}

interface IBatch extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  maxAttempts: number;
}

interface IExam extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  totalMarks: number;
  passPercentage: number;
  questionsToDisplay: number;
  totalQuestions: number;
  name: string;
  description: string;
  duration: number;
  course: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Move these variables outside the try block to make them available in the catch block
  let studentId: string;
  let currentAttempt: number = 1;
  let remainingAttempts: number = 0;
  let batch: IBatch | null = null;
  let additionalAttempts: number = 0;
  let totalMaxAttempts: number = 0;

  try {
    // Get token and validate
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    studentId = decoded.userId;

    // Get the exam
    const exam = (await mongooseUtils.findById(Exam, id as string)) as IExam | null;
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Get student's batch
    const student = await mongooseUtils.findById(User, studentId);
    if (!student || !student.batch) {
      return res.status(400).json({
        success: false,
        message: 'Student is not assigned to any batch',
      });
    }

    // Get batch details
    batch = await mongooseUtils.findById<IBatch>(Batch as any, student.batch);
    if (!batch) {
      return res.status(400).json({
        success: false,
        message: 'Student batch not found',
      });
    }

    // Get previous attempts, excluding those from previous payment cycles
    const previousAttempts = await mongooseUtils.find<IResult>(
      Result,
      {
        student: studentId,
        exam: id,
        fromPreviousPaymentCycle: { $ne: true }, // Only count attempts from current payment cycle
      },
      null,
      {
        sort: { attemptNumber: -1 },
      }
    );

    // Get all successful payments for additional attempts
    const successfulPayments = await mongooseUtils.find(Payment, {
      student: studentId,
      exam: id,
      status: 'success',
      paymentType: 'max_attempts',
    });

    // Calculate cumulative additional attempts from all payments
    additionalAttempts = successfulPayments.reduce((total, payment) => {
      return total + (payment.additionalAttempts || 0);
    }, 0);

    // Calculate total max attempts including additional ones from all payments
    totalMaxAttempts = batch.maxAttempts + additionalAttempts;

    currentAttempt = previousAttempts.length > 0 ? previousAttempts[0].attemptNumber + 1 : 1;
    remainingAttempts = Math.max(0, totalMaxAttempts - currentAttempt);

    console.log('EXAM SUBMIT ATTEMPT CHECK:', {
      examId: id,
      studentId,
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

    const { answers, startTime } = req.body;

    // Validate startTime
    const validStartTime = new Date(startTime);
    if (isNaN(validStartTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start time provided',
      });
    }

    // Get all questions for this exam
    const questions = await mongooseUtils.find<IQuestion>(Question, { exam: id });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    // Validate and process answers
    const processedAnswers = answers.map((answer: AnswerSubmission) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new Error(`Question not found: ${answer.questionId}`);
      }

      // Handle unanswered questions marked with 'not_attempted'
      if (answer.selectedOption === 'not_attempted') {
        return {
          question: answer.questionId,
          selectedOption: 'not_attempted', // Keep the marker for database record
          isCorrect: false, // Unanswered questions are not correct
        };
      }

      const isCorrect =
        question.options.find(opt => opt.text === answer.selectedOption && opt.isCorrect) !==
        undefined;

      return {
        question: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
      };
    });

    // Calculate score and performance metrics
    const totalQuestions = exam.questionsToDisplay;
    const correctAnswers = processedAnswers.filter(answer => answer.isCorrect).length;
    const wrongAnswers = totalQuestions - correctAnswers;

    // Calculate score based on the number of displayed questions
    const scorePerQuestion = exam.totalMarks / totalQuestions;
    const score = Math.round(correctAnswers * scorePerQuestion);
    const percentage = Math.round((score / exam.totalMarks) * 100);
    const passed = percentage >= exam.passPercentage;

    // Create new result
    const result = await mongooseUtils.create<IResult>(Result, {
      student: studentId,
      exam: id,
      answers: processedAnswers,
      score,
      totalQuestions: exam.questionsToDisplay,
      percentage,
      passed,
      startTime: validStartTime,
      endTime: new Date(),
      attemptNumber: currentAttempt,
    });

    // Ensure result is a single document
    if (Array.isArray(result)) {
      throw new Error('Expected single result document but got array');
    }

    return res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        score,
        totalQuestions,
        percentage,
        passed,
        attemptNumber: currentAttempt,
        performance: {
          correctAnswers,
          wrongAnswers,
          totalQuestions,
          score: `${correctAnswers}/${totalQuestions}`,
        },
        attempts: {
          current: currentAttempt,
          max: totalMaxAttempts,
          remaining: remainingAttempts,
        },
      },
    });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    if (error.code === 11000) {
      // Duplicate key error - attempt already submitted
      try {
        // Find the existing result
        const existingResult = await mongooseUtils.findOne<IResult>(Result, {
          student: studentId,
          exam: id,
          attemptNumber: currentAttempt,
        });

        if (existingResult) {
          // Return the existing result instead of an error
          return res.status(200).json({
            success: true,
            message: 'This attempt was already submitted',
            result: {
              _id: existingResult._id,
              score: existingResult.score,
              totalQuestions: existingResult.totalQuestions,
              percentage: existingResult.percentage,
              passed: existingResult.passed,
              attemptNumber: existingResult.attemptNumber,
              performance: {
                correctAnswers: existingResult.answers.filter(a => a.isCorrect).length,
                wrongAnswers:
                  existingResult.totalQuestions -
                  existingResult.answers.filter(a => a.isCorrect).length,
                totalQuestions: existingResult.totalQuestions,
                score: `${existingResult.answers.filter(a => a.isCorrect).length}/${existingResult.totalQuestions}`,
              },
              attempts: {
                current: currentAttempt,
                max: totalMaxAttempts,
                remaining: remainingAttempts,
              },
            },
          });
        }
      } catch (innerError) {
        console.error('Error retrieving existing result:', innerError);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Error submitting exam',
    });
  }
}

export default authenticateAPI(handler);
