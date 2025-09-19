import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../../utils/auth';
import dbConnect from '../../../../../utils/db';
import Exam from '../../../../../models/Exam';
import Result from '../../../../../models/Result';
import Course from '../../../../../models/Course';
import User from '../../../../../models/User';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../../utils/mongooseUtils';
import { validateStudentSubscription } from '../../../../../utils/subscriptionValidation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  // GET - Fetch exams for a course
  if (req.method === 'GET') {
    try {
      // Check if course exists
      const course = await mongooseUtils.findById(Course, id as string);

      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Get student's batch
      const student = await mongooseUtils.findById(User, req.user.userId);
      const studentBatchId = student?.batch;

      // ✅ ADD: Subscription validation
      if (studentBatchId) {
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
      }

      // Build query for exams
      let examQuery: any = { course: id };

      // If student is in a batch, show exams assigned to their batch or with no batch assignments
      if (studentBatchId) {
        examQuery = {
          course: id,
          assignedBatches: { $in: [studentBatchId] }, // Only show exams assigned to student's batch
        };
      } else {
        // If student has no batch, don't show any exams
        examQuery = { _id: { $exists: false } }; // This will return no results
      }

      // Fetch all exams for this course that are assigned to the student's batch
      const exams = await mongooseUtils.find(Exam, examQuery, null, {
        sort: { createdAt: -1 },
      });

      // Find results for this student
      const results = await mongooseUtils.find(Result, {
        student: req.user.userId,
        exam: { $in: exams.map(exam => exam._id) },
      });

      const examsTaken = new Set(results.map(result => result.exam.toString()));

      // Add hasTaken flag to each exam
      const examsWithTakenStatus = exams.map(exam => {
        const examObj = exam.toObject();
        examObj.hasTaken = examsTaken.has(exam._id.toString());
        return examObj;
      });

      return res.status(200).json({
        success: true,
        exams: examsWithTakenStatus,
      });
    } catch (error) {
      console.error('Error fetching course exams:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
