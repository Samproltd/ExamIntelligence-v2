import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Exam from '../../../models/Exam';
import Batch from '../../../models/Batch';
import BatchSubscriptionAssignment from '../../../models/BatchSubscriptionAssignment';
import StudentSubscription from '../../../models/StudentSubscription';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  try {
    const studentId = req.user.userId;
    
    // Get student
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(200).json({
        success: true,
        message: 'Student not found',
        data: { studentId, student: null }
      });
    }

    // Get student's batch
    const studentBatchId = student.batch;
    
    // Get batch details
    const batch = studentBatchId ? await Batch.findById(studentBatchId) : null;
    
    // Get batch assignment
    const batchAssignment = studentBatchId ? await BatchSubscriptionAssignment.findOne({
      batch: studentBatchId,
      isActive: true
    }).populate('subscriptionPlan') : null;
    
    // Get student subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: studentId
    }).populate('plan');
    
    // Get exams assigned to batch
    const examsAssignedToBatch = studentBatchId ? await Exam.find({
      assignedBatches: { $in: [studentBatchId] }
    }) : [];

    // Simple summary
    const summary = {
      studentHasBatch: !!studentBatchId,
      batchExists: !!batch,
      batchHasAssignment: !!batchAssignment,
      studentHasSubscription: !!studentSubscription,
      examsAssignedToBatch: examsAssignedToBatch.length,
      issues: []
    };

    // Check for issues
    if (!studentBatchId) {
      summary.issues.push('Student is not assigned to any batch');
    }
    if (studentBatchId && !batch) {
      summary.issues.push('Student batch does not exist');
    }
    if (studentBatchId && !batchAssignment) {
      summary.issues.push('Batch is not assigned to any subscription plan');
    }
    if (!studentSubscription) {
      summary.issues.push('Student has no subscription');
    }
    if (examsAssignedToBatch.length === 0) {
      summary.issues.push('No exams are assigned to student\'s batch');
    }

    return res.status(200).json({
      success: true,
      message: 'Simple debug completed',
      data: {
        studentId,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          batch: student.batch,
          subscription: student.subscription
        },
        batch: batch ? {
          id: batch._id,
          name: batch.name,
          isActive: batch.isActive
        } : null,
        batchAssignment: batchAssignment ? {
          id: batchAssignment._id,
          batch: batchAssignment.batch,
          subscriptionPlan: batchAssignment.subscriptionPlan,
          isActive: batchAssignment.isActive
        } : null,
        studentSubscription: studentSubscription ? {
          id: studentSubscription._id,
          plan: studentSubscription.plan,
          startDate: studentSubscription.startDate,
          endDate: studentSubscription.endDate,
          status: studentSubscription.status,
          paymentStatus: studentSubscription.paymentStatus
        } : null,
        examsAssignedToBatch: examsAssignedToBatch.map(exam => ({
          id: exam._id,
          name: exam.name,
          assignedBatches: exam.assignedBatches
        })),
        summary
      }
    });

  } catch (error) {
    console.error('Simple debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default authenticateAPI(handler);
