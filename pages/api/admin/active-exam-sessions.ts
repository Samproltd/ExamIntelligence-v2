import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import ActiveExamSession from '../../../models/ActiveExamSession';
import Result from '../../../models/Result';
import ExamSuspension from '../../../models/ExamSuspension';
import * as mongooseUtils from '../../../utils/mongooseUtils';
import mongoose from 'mongoose';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  // GET - Fetch active exam sessions
  if (req.method === 'GET') {
    try {
      // Cleanup invalid sessions - run this automatically when admin accesses the page
      try {
        // Find sessions with missing student or exam references
        const invalidSessions = await mongooseUtils.find(ActiveExamSession, {
          $or: [
            { student: { $exists: false } },
            { student: null },
            { exam: { $exists: false } },
            { exam: null },
          ],
        });

        if (invalidSessions.length > 0) {
          console.log(`Found ${invalidSessions.length} invalid sessions to clean up`);

          // Delete the invalid sessions
          await mongooseUtils.deleteMany(ActiveExamSession, {
            _id: { $in: invalidSessions.map(session => session._id) },
          });

          console.log(`Cleaned up ${invalidSessions.length} invalid sessions`);
        }
      } catch (cleanupError) {
        console.error('Error during session cleanup:', cleanupError);
        // Continue with the rest of the function even if cleanup fails
      }

      // Get active sessions with populated student and exam details
      const activeSessions = await mongooseUtils.find(ActiveExamSession, { isActive: true }, null, {
        sort: { startTime: -1 },
        populate: [
          {
            path: 'student',
            select: 'name email rollNumber batch',
            populate: {
              path: 'batch',
              select: 'name',
            },
          },
          {
            path: 'exam',
            select: 'name duration course',
            populate: {
              path: 'course',
              select: 'name',
            },
          },
        ],
      });

      if (activeSessions.length === 0) {
        return res.status(200).json({
          success: true,
          activeSessions: [],
          groupedByExam: [],
          totalActive: 0,
        });
      }

      console.log(`Processing ${activeSessions.length} active sessions`);

      // Extract student and exam IDs from active sessions
      const studentExamPairs = [];
      for (const session of activeSessions) {
        try {
          if (session && session.student && session.exam) {
            studentExamPairs.push({
              student: session.student._id,
              exam: session.exam._id,
            });
          } else {
            console.log('Skipping session without student or exam:', {
              id: session?._id,
              hasStudent: !!session?.student,
              hasExam: !!session?.exam,
            });
          }
        } catch (pairError) {
          console.error('Error processing session for pairs:', pairError, {
            sessionId: session?._id,
          });
        }
      }

      // Create arrays of student IDs and exam IDs
      const studentIds = studentExamPairs.map(pair => pair.student);
      const examIds = studentExamPairs.map(pair => pair.exam);

      // Get results created in the last 24 hours for these students and exams
      const recentResults = await mongooseUtils.find(Result, {
        student: { $in: studentIds },
        exam: { $in: examIds },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      // Get active suspensions for these students and exams
      const activeSuspensions = await mongooseUtils.find(ExamSuspension, {
        student: { $in: studentIds },
        exam: { $in: examIds },
        removed: { $ne: true },
      });

      // Create sets for quick lookup of student-exam pairs that have results or suspensions
      const submittedPairs = new Set(
        recentResults.map(result => `${result.student.toString()}-${result.exam.toString()}`)
      );

      const suspendedPairs = new Set(
        activeSuspensions.map(
          suspension => `${suspension.student.toString()}-${suspension.exam.toString()}`
        )
      );

      // Filter out sessions for students who have submitted or been suspended
      const filteredSessions = [];
      for (const session of activeSessions) {
        try {
          // Skip sessions with missing student or exam
          if (!session || !session.student || !session.exam) {
            continue;
          }

          const pairKey = `${session.student._id.toString()}-${session.exam._id.toString()}`;
          if (!submittedPairs.has(pairKey) && !suspendedPairs.has(pairKey)) {
            filteredSessions.push(session);
          }
        } catch (filterError) {
          console.error('Error filtering session:', filterError, {
            sessionId: session?._id,
          });
        }
      }

      // Calculate additional metrics for each session
      const processedSessions = [];
      for (const session of filteredSessions) {
        try {
          const startTime = new Date(session.startTime);
          const now = new Date();
          const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

          // Calculate idle time (time since last activity)
          const lastActive = new Date(session.lastActive);
          const idleMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));

          // Get the exam duration if available
          const duration = session.exam?.duration || 0;

          // Calculate remaining time
          const remainingMinutes = Math.max(0, duration - elapsedMinutes);

          // Calculate progress percentage
          const progressPercentage =
            duration > 0 ? Math.min(100, Math.floor((elapsedMinutes / duration) * 100)) : 0;

          processedSessions.push({
            _id: session._id,
            student: session.student,
            exam: session.exam,
            startTime: session.startTime,
            lastActive: session.lastActive,
            browserInfo: session.browserInfo,
            ipAddress: session.ipAddress,
            deviceInfo: session.deviceInfo,
            metrics: {
              elapsedMinutes,
              idleMinutes,
              remainingMinutes,
              progressPercentage,
              isIdle: idleMinutes > 5, // Consider idle if no activity for 5+ minutes
              isOvertime: duration > 0 && elapsedMinutes > duration,
            },
          });
        } catch (processError) {
          console.error('Error processing session metrics:', processError, {
            sessionId: session?._id,
          });
        }
      }

      // Group by exam for easier UI rendering
      const examMap = new Map();
      for (const session of processedSessions) {
        try {
          if (!session.exam) {
            continue; // Skip sessions with missing exam
          }

          const examId = session.exam._id.toString();
          if (!examMap.has(examId)) {
            examMap.set(examId, {
              exam: session.exam,
              students: [],
            });
          }
          examMap.get(examId).students.push(session);
        } catch (groupError) {
          console.error('Error grouping session by exam:', groupError, {
            sessionId: session?._id,
          });
        }
      }

      const groupedSessions = Array.from(examMap.values());

      return res.status(200).json({
        success: true,
        activeSessions: processedSessions,
        groupedByExam: groupedSessions,
        totalActive: processedSessions.length,
      });
    } catch (error) {
      console.error('Error fetching active exam sessions:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
