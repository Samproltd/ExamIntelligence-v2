import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Subject from '../../../models/Subject';
import Course from '../../../models/Course';
import Exam from '../../../models/Exam';
import Result from '../../../models/Result';
import User from '../../../models/User';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  // GET - Fetch dashboard data for student
  if (req.method === 'GET') {
    try {
      // Set caching headers to reduce frequent API calls
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

      // Fetch all subjects
      const subjects = await mongooseUtils.find(Subject, {}, null, {
        sort: { name: 1 },
        limit: 6,
      });

      // Get recent results for this student
      const recentResults = await mongooseUtils.find(Result, { student: req.user.userId }, null, {
        sort: { createdAt: -1 },
        limit: 5,
        populate: {
          path: 'exam',
          select: 'name course',
          populate: { path: 'course', select: 'name' },
        },
      });

      // Get courses the student has interacted with (through results)
      const takenExams = await mongooseUtils.distinct(Result, 'exam', {
        student: req.user.userId,
      });

      // Get exam details for course filtering
      const examDetails = await mongooseUtils.distinct(Exam, 'course', {
        _id: { $in: takenExams },
      });

      // Get recent courses (either taken by student or most recent in general)
      let recentCourses;
      if (examDetails.length > 0) {
        recentCourses = await mongooseUtils.find(Course, { _id: { $in: examDetails } }, null, {
          populate: { path: 'subject', select: 'name' },
          sort: { createdAt: -1 },
          limit: 3,
        });
      } else {
        recentCourses = await mongooseUtils.find(Course, {}, null, {
          populate: { path: 'subject', select: 'name' },
          sort: { createdAt: -1 },
          limit: 3,
        });
      }

      // Get student's batch
      const student = await mongooseUtils.findById(User, req.user.userId);
      const studentBatchId = student?.batch;

      // Get upcoming exams (exams not yet taken by the student and assigned to their batch or with no batch assignment)
      const takenExamIds = new Set(takenExams.map(id => id.toString()));

      // Build query for exams
      let examQuery: any = {};

      // If student is in a batch, show exams assigned to their batch or with no batch assignments
      if (studentBatchId) {
        examQuery = {
          assignedBatches: { $in: [studentBatchId] }, // Only show exams assigned to student's batch
        };
      } else {
        // If student has no batch, don't show any exams
        examQuery = { _id: { $exists: false } }; // This will return no results
      }

      const upcomingExams = await mongooseUtils.find(Exam, examQuery, null, {
        populate: { path: 'course', select: 'name' },
        sort: { createdAt: -1 },
        limit: 10,
      });

      const filteredUpcomingExams = upcomingExams
        .filter(exam => !takenExamIds.has(exam._id.toString()))
        .slice(0, 5);

      return res.status(200).json({
        success: true,
        subjects,
        recentCourses,
        upcomingExams: filteredUpcomingExams,
        recentResults,
        user: student,
      });
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
