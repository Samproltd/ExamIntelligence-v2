import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import User from '../../../../models/User';
import Result from '../../../../models/Result';
import * as mongooseUtils from '../../../../utils/mongooseUtils';
import { validateStudentSubscription } from '../../../../utils/subscriptionValidation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  // GET - Fetch exams for student
  if (req.method === 'GET') {
    try {
      // Get student's batch
      const student = await mongooseUtils.findById(User, req.user.userId);
      if (!student || !student.batch) {
        return res.status(400).json({
          success: false,
          message: 'Student is not assigned to any batch',
        });
      }

      const studentBatchId = student.batch;

      // ✅ ADD: Subscription validation
      console.log(`🔍 Validating subscription for student: ${req.user.userId}, batch: ${studentBatchId}`);
      const subscriptionValidation = await validateStudentSubscription(req.user.userId, studentBatchId);
      
      if (!subscriptionValidation.valid) {
        console.log(`❌ Subscription validation failed: ${subscriptionValidation.reason}`);
        return res.status(403).json({
          success: false,
          message: subscriptionValidation.reason,
          subscriptionRequired: subscriptionValidation.subscriptionPlan || null,
          hasActiveSubscription: subscriptionValidation.hasActiveSubscription,
          subscriptionExpired: subscriptionValidation.subscriptionExpired,
          batchNotAssigned: subscriptionValidation.batchNotAssigned
        });
      }

      console.log(`✅ Subscription validation passed for student: ${req.user.userId}`);

      // Build query for exams assigned to student's batch
      const examQuery = {
        assignedBatches: { $in: [studentBatchId] }, // Only show exams assigned to student's batch
      };

      // Fetch exams with course and subject info
      const exams = await mongooseUtils.find(Exam, examQuery, null, {
        populate: {
          path: 'course',
          select: 'name subject',
          populate: {
            path: 'subject',
            select: 'name',
          },
        },
      });

      // Check all previous attempts for this student for each exam
      const results = await mongooseUtils.find(Result, {
        student: req.user.userId,
      });

      // Create a map of exam ID to results
      const examResultsMap = new Map();
      results.forEach(result => {
        const examId = result.exam.toString();
        if (!examResultsMap.has(examId)) {
          examResultsMap.set(examId, []);
        }
        examResultsMap.get(examId).push(result);
      });

      // Process exams to add attempt information
      const processedExams = exams.map(exam => {
        const examId = exam._id.toString();
        const examResults = examResultsMap.get(examId) || [];
        const attemptsMade = examResults.length;
        const hasTaken = attemptsMade > 0;

        // Sort results by creation date (descending) to get latest attempt
        const sortedResults = examResults.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const latestResult = sortedResults[0];

        // Default values
        let result = null;

        if (latestResult) {
          result = {
            _id: latestResult._id.toString(),
            score: latestResult.score,
            totalQuestions: latestResult.totalQuestions,
            percentage: latestResult.percentage,
            passed: latestResult.passed,
            attemptNumber: attemptsMade,
          };
        }

        return {
          _id: examId,
          name: exam.name,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          course: {
            _id: exam.course._id,
            name: exam.course.name,
            subject: {
              _id: exam.course.subject._id,
              name: exam.course.subject.name,
            },
          },
          hasTaken,
          maxAttempts: exam.maxAttempts,
          result: result,
        };
      });

      return res.status(200).json({
        success: true,
        exams: processedExams,
      });
    } catch (error) {
      console.error('Error fetching student exams:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
