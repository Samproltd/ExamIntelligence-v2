import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Exam from '../../../models/Exam';
import Batch from '../../../models/Batch';
import BatchSubscriptionAssignment from '../../../models/BatchSubscriptionAssignment';
import StudentSubscription from '../../../models/StudentSubscription';
import SubscriptionPlan from '../../../models/SubscriptionPlan';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  try {
    const studentId = req.user.userId;
    const debugInfo: any = {
      studentId,
      timestamp: new Date().toISOString(),
      steps: []
    };

    // Step 1: Check if student exists and has batch
    const student = await User.findById(studentId);
    debugInfo.steps.push({
      step: 1,
      description: 'Check student and batch assignment',
      student: student ? {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        batch: student.batch
      } : null,
      hasBatch: !!student?.batch
    });

    if (!student || !student.batch) {
      // Create summary for students without batch
      const summary = {
        studentHasBatch: false,
        batchHasAssignment: false,
        studentHasSubscription: false,
        subscriptionIsValid: false,
        examsAssignedToBatch: 0,
        finalExamsVisible: 0,
        issues: ['Student is not assigned to any batch']
      };
      
      debugInfo.summary = summary;
      
      return res.status(200).json({
        success: true,
        message: 'Debug completed - Student has no batch assigned',
        debugInfo
      });
    }

    const studentBatchId = student.batch;

    // Step 2: Check batch details
    const batch = await Batch.findById(studentBatchId);
    debugInfo.steps.push({
      step: 2,
      description: 'Check batch details',
      batch: batch ? {
        id: batch._id,
        name: batch.name,
        isActive: batch.isActive
      } : null
    });

    // Step 3: Check batch-subscription assignment
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: studentBatchId,
      isActive: true
    }).populate('subscriptionPlan');

    debugInfo.steps.push({
      step: 3,
      description: 'Check batch-subscription assignment',
      batchAssignment: batchAssignment ? {
        id: batchAssignment._id,
        batch: batchAssignment.batch,
        subscriptionPlan: batchAssignment.subscriptionPlan,
        isActive: batchAssignment.isActive,
        createdAt: batchAssignment.createdAt
      } : null,
      hasAssignment: !!batchAssignment
    });

    // Step 4: Check student subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: studentId
    }).populate('plan');

    debugInfo.steps.push({
      step: 4,
      description: 'Check student subscription',
      studentSubscription: studentSubscription ? {
        id: studentSubscription._id,
        plan: studentSubscription.plan,
        startDate: studentSubscription.startDate,
        endDate: studentSubscription.endDate,
        status: studentSubscription.status,
        paymentStatus: studentSubscription.paymentStatus,
        isExpired: new Date(studentSubscription.endDate) < new Date()
      } : null,
      hasSubscription: !!studentSubscription
    });

    // Step 5: Check exams assigned to batch
    const examsAssignedToBatch = await Exam.find({
      assignedBatches: { $in: [studentBatchId] }
    }).populate('course', 'name').populate('subject', 'name');

    debugInfo.steps.push({
      step: 5,
      description: 'Check exams assigned to batch',
      examsCount: examsAssignedToBatch.length,
      exams: examsAssignedToBatch.map(exam => ({
        id: exam._id,
        name: exam.name,
        course: exam.course,
        subject: exam.subject,
        assignedBatches: exam.assignedBatches,
        isActive: exam.isActive,
        createdAt: exam.createdAt
      }))
    });

    // Step 6: Check all exams in system
    const allExams = await Exam.find({}).populate('course', 'name').populate('subject', 'name');
    debugInfo.steps.push({
      step: 6,
      description: 'Check all exams in system',
      totalExams: allExams.length,
      examsWithBatches: allExams.filter(exam => exam.assignedBatches && exam.assignedBatches.length > 0).length,
      examsWithoutBatches: allExams.filter(exam => !exam.assignedBatches || exam.assignedBatches.length === 0).length
    });

    // Step 7: Check subscription validation
    let subscriptionValidation = null;
    if (batchAssignment) {
      if (!studentSubscription) {
        subscriptionValidation = {
          valid: false,
          reason: 'No subscription found. Please subscribe to access exams.',
          hasActiveSubscription: false
        };
      } else {
        const now = new Date();
        const isExpired = studentSubscription.endDate < now;
        
        if (isExpired) {
          subscriptionValidation = {
            valid: false,
            reason: 'Your subscription has expired. Please renew to access exams.',
            subscriptionExpired: true
          };
        } else if (studentSubscription.status !== 'active') {
          subscriptionValidation = {
            valid: false,
            reason: `Your subscription is ${studentSubscription.status}. Please contact support.`
          };
        } else if (studentSubscription.plan._id.toString() !== batchAssignment.subscriptionPlan._id.toString()) {
          subscriptionValidation = {
            valid: false,
            reason: 'Your current subscription plan does not match the required plan for this batch.'
          };
        } else {
          subscriptionValidation = {
            valid: true,
            reason: 'Subscription is valid'
          };
        }
      }
    } else {
      subscriptionValidation = {
        valid: false,
        reason: 'This batch is not assigned to any subscription plan',
        batchNotAssigned: true
      };
    }

    debugInfo.steps.push({
      step: 7,
      description: 'Subscription validation result',
      validation: subscriptionValidation
    });

    // Step 8: Final exam query that would be used
    let finalExamQuery = null;
    let finalExams = [];
    
    if (subscriptionValidation.valid) {
      finalExamQuery = {
        assignedBatches: { $in: [studentBatchId] }
      };
      finalExams = await Exam.find(finalExamQuery).populate('course', 'name').populate('subject', 'name');
    }

    debugInfo.steps.push({
      step: 8,
      description: 'Final exam query and results',
      examQuery: finalExamQuery,
      finalExamsCount: finalExams.length,
      finalExams: finalExams.map(exam => ({
        id: exam._id,
        name: exam.name,
        course: exam.course,
        subject: exam.subject
      }))
    });

    // Summary
    const summary = {
      studentHasBatch: !!student?.batch,
      batchHasAssignment: !!batchAssignment,
      studentHasSubscription: !!studentSubscription,
      subscriptionIsValid: subscriptionValidation.valid,
      examsAssignedToBatch: examsAssignedToBatch.length,
      finalExamsVisible: finalExams.length,
      issues: []
    };

    if (!student?.batch) {
      summary.issues.push('Student is not assigned to any batch');
    }
    if (!batchAssignment) {
      summary.issues.push('Batch is not assigned to any subscription plan');
    }
    if (!studentSubscription) {
      summary.issues.push('Student has no subscription');
    }
    if (studentSubscription && new Date(studentSubscription.endDate) < new Date()) {
      summary.issues.push('Student subscription has expired');
    }
    if (studentSubscription && studentSubscription.status !== 'active') {
      summary.issues.push(`Student subscription status is ${studentSubscription.status}`);
    }
    if (batchAssignment && studentSubscription && studentSubscription.plan._id.toString() !== batchAssignment.subscriptionPlan._id.toString()) {
      summary.issues.push('Student subscription plan does not match batch assignment');
    }
    if (examsAssignedToBatch.length === 0) {
      summary.issues.push('No exams are assigned to student\'s batch');
    }

    debugInfo.summary = summary;

    return res.status(200).json({
      success: true,
      message: 'Debug completed',
      debugInfo
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default authenticateAPI(handler);
