import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import ActiveExamSession from '../../../../models/ActiveExamSession';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only POST method is allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { examId, action, browserInfo, deviceInfo } = req.body;
    const studentId = req.user.userId;

    // Get the client IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    // Action must be one of: 'start', 'heartbeat', 'end'
    if (!['start', 'heartbeat', 'end'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: start, heartbeat, end',
      });
    }

    // Check if the exam ID is valid
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Exam ID is required' });
    }

    // Handle each action type
    switch (action) {
      case 'start':
        // Check if session already exists
        let session = await mongooseUtils.findOne(ActiveExamSession, {
          student: studentId,
          exam: examId,
        });

        if (session) {
          // Update existing session
          await mongooseUtils.updateOne(
            ActiveExamSession,
            { student: studentId, exam: examId },
            {
              startTime: new Date(),
              lastActive: new Date(),
              browserInfo: browserInfo || '',
              ipAddress: ipAddress,
              deviceInfo: deviceInfo || '',
              isActive: true,
            }
          );

          // Fetch the updated session
          session = await mongooseUtils.findOne(ActiveExamSession, {
            student: studentId,
            exam: examId,
          });
        } else {
          // Create new session
          session = await mongooseUtils.create(ActiveExamSession, {
            student: studentId,
            exam: examId,
            startTime: new Date(),
            lastActive: new Date(),
            browserInfo: browserInfo || '',
            ipAddress: ipAddress,
            deviceInfo: deviceInfo || '',
            isActive: true,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Exam session started',
          session: {
            id: session._id,
            startTime: session.startTime,
            lastActive: session.lastActive,
          },
        });

      case 'heartbeat':
        // Update the lastActive timestamp
        await mongooseUtils.updateOne(
          ActiveExamSession,
          { student: studentId, exam: examId, isActive: true },
          { lastActive: new Date() }
        );

        return res.status(200).json({
          success: true,
          message: 'Exam session updated',
        });

      case 'end':
        // Mark the session as inactive
        await mongooseUtils.updateOne(
          ActiveExamSession,
          { student: studentId, exam: examId },
          { isActive: false }
        );

        return res.status(200).json({
          success: true,
          message: 'Exam session ended',
        });
    }
  } catch (error) {
    console.error('Error tracking exam session:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export default authenticateAPI(handler);
