import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Batch from '../../../../models/Batch';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
import StudentSubscription from '../../../../models/StudentSubscription';
import User from '../../../../models/User';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Only students can access this endpoint
    if (decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get student's active subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: decoded.userId,
      status: 'active'
    }).populate('plan');

    if (!studentSubscription) {
      return res.status(200).json({
        success: true,
        exams: [],
        message: 'No active subscription found'
      });
    }

    // Get batches assigned to the student's subscription plan
    const batchAssignments = await BatchSubscriptionAssignment.find({
      subscriptionPlan: studentSubscription.plan._id,
      isActive: true
    });

    if (batchAssignments.length === 0) {
      return res.status(200).json({
        success: true,
        exams: [],
        message: 'No batches assigned to your subscription plan'
      });
    }

    // Extract batch IDs
    const batchIds = batchAssignments.map(assignment => assignment.batch);

    // Get exams assigned to these batches
    const availableExams = await Exam.find({
      assignedBatches: { $in: batchIds },
      isActive: true
    })
      .populate({
        path: 'course',
        select: 'name subject',
        populate: {
          path: 'subject',
          select: 'name college',
          populate: {
            path: 'college',
            select: 'name code'
          }
        }
      })
      .populate('college', 'name code')
      .sort({ createdAt: -1 });

    // Get batch details for context
    const batches = await Batch.find({ _id: { $in: batchIds } })
      .populate('subject', 'name')
      .populate('college', 'name code');

    // Add batch context to exams
    const examsWithBatchInfo = availableExams.map(exam => {
      const examBatches = batches.filter(batch => 
        exam.assignedBatches && exam.assignedBatches.some(assignedBatchId => 
          assignedBatchId.toString() === batch._id.toString()
        )
      );

      return {
        ...exam.toObject(),
        accessibleBatches: examBatches.map(batch => ({
          _id: batch._id,
          name: batch.name,
          subject: batch.subject,
          college: batch.college
        }))
      };
    });

    return res.status(200).json({
      success: true,
      exams: examsWithBatchInfo,
      subscription: {
        plan: studentSubscription.plan.name,
        status: studentSubscription.status,
        endDate: studentSubscription.endDate
      },
      totalExams: examsWithBatchInfo.length,
      totalBatches: batches.length
    });
  } catch (error) {
    console.error('Get available exams error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch available exams' });
  }
}
