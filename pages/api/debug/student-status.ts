import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Batch from '../../../models/Batch';
import BatchSubscriptionAssignment from '../../../models/BatchSubscriptionAssignment';
import StudentSubscription from '../../../models/StudentSubscription';
import Exam from '../../../models/Exam';
import SubscriptionPlan from '../../../models/SubscriptionPlan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const studentEmail = 'bhushan0242@gmail.com';
    
    console.log('🔍 Debugging student status for:', studentEmail);

    // Step 1: Find the student
    const student = await User.findOne({ email: studentEmail });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found',
        debug: {
          step: 'student_lookup',
          issue: 'Student not found in database',
          email: studentEmail
        }
      });
    }

    const debugInfo = {
      student: {
        name: student.name,
        email: student.email,
        role: student.role,
        batch: student.batch,
        isBlocked: student.isBlocked,
        subscriptionStatus: student.subscriptionStatus,
        college: student.college
      }
    };

    // Step 2: Check if student has a batch
    if (!student.batch) {
      return res.status(400).json({
        success: false,
        message: 'Student not assigned to any batch',
        debug: {
          ...debugInfo,
          step: 'batch_assignment',
          issue: 'Student has no batch assigned',
          solution: 'Admin needs to assign student to a batch'
        }
      });
    }

    // Step 3: Get batch details
    const batch = await Batch.findById(student.batch).populate('subject college');
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
        debug: {
          ...debugInfo,
          step: 'batch_lookup',
          issue: 'Batch referenced by student does not exist',
          batchId: student.batch
        }
      });
    }

    debugInfo.batch = {
      name: batch.name,
      description: batch.description,
      year: batch.year,
      subject: batch.subject?.name,
      college: batch.college?.name,
      isActive: batch.isActive
    };

    // Step 4: Check batch subscription assignment
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: student.batch,
      isActive: true
    }).populate('subscriptionPlan');

    if (!batchAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Batch not assigned to subscription plan',
        debug: {
          ...debugInfo,
          step: 'batch_subscription_assignment',
          issue: 'Batch has no subscription plan assigned',
          solution: 'Admin needs to assign batch to subscription plan at /admin/batch-assignments'
        }
      });
    }

    debugInfo.batchAssignment = {
      planName: batchAssignment.subscriptionPlan.name,
      planPrice: batchAssignment.subscriptionPlan.price,
      planDuration: batchAssignment.subscriptionPlan.duration,
      isActive: batchAssignment.isActive,
      assignmentDate: batchAssignment.assignmentDate
    };

    // Step 5: Check student's individual subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: student._id
    }).populate('plan');

    if (!studentSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Student has no subscription',
        debug: {
          ...debugInfo,
          step: 'student_subscription',
          issue: 'Student has no individual subscription',
          solution: `Student needs to subscribe to: ${batchAssignment.subscriptionPlan.name} (₹${batchAssignment.subscriptionPlan.price})`
        }
      });
    }

    const now = new Date();
    const isExpired = studentSubscription.endDate < now;

    debugInfo.studentSubscription = {
      planName: studentSubscription.plan.name,
      status: studentSubscription.status,
      startDate: studentSubscription.startDate,
      endDate: studentSubscription.endDate,
      isExpired: isExpired,
      paymentStatus: studentSubscription.paymentStatus
    };

    // Step 6: Validate subscription
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Student subscription has expired',
        debug: {
          ...debugInfo,
          step: 'subscription_validation',
          issue: 'Subscription has expired',
          expiredDate: studentSubscription.endDate,
          solution: 'Student needs to renew subscription'
        }
      });
    }

    if (studentSubscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Student subscription is not active',
        debug: {
          ...debugInfo,
          step: 'subscription_validation',
          issue: `Subscription status is "${studentSubscription.status}"`,
          solution: 'Subscription must be "active" to access exams'
        }
      });
    }

    // Step 7: Check plan mismatch
    if (studentSubscription.plan._id.toString() !== batchAssignment.subscriptionPlan._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plan mismatch',
        debug: {
          ...debugInfo,
          step: 'plan_validation',
          issue: 'Student subscribed to different plan than batch requires',
          studentPlan: studentSubscription.plan.name,
          requiredPlan: batchAssignment.subscriptionPlan.name,
          solution: 'Student needs to subscribe to the correct plan'
        }
      });
    }

    // Step 8: Check available exams
    const exams = await Exam.find({
      assignedBatches: { $in: [student.batch] }
    }).populate('course subject college');

    debugInfo.exams = {
      count: exams.length,
      examList: exams.map(exam => ({
        name: exam.name,
        course: exam.course?.name,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        isActive: exam.isActive
      }))
    };

    if (exams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No exams assigned to batch',
        debug: {
          ...debugInfo,
          step: 'exam_assignment',
          issue: 'No exams are assigned to student\'s batch',
          solution: 'Admin needs to assign exams to batch at /admin/assign-exams'
        }
      });
    }

    // All checks passed
    return res.status(200).json({
      success: true,
      message: 'All validation checks passed - Student should see exams',
      debug: debugInfo
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
