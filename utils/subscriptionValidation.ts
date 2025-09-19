import BatchSubscriptionAssignment from '../models/BatchSubscriptionAssignment';
import StudentSubscription from '../models/StudentSubscription';
import User from '../models/User';
import SubscriptionPlan from '../models/SubscriptionPlan';

export interface SubscriptionValidationResult {
  valid: boolean;
  reason?: string;
  subscriptionPlan?: any;
  currentSubscription?: any;
  requiredPlan?: any;
  hasActiveSubscription?: boolean;
  subscriptionExpired?: boolean;
  batchNotAssigned?: boolean;
}

/**
 * Validates if a student has access to exams based on their subscription status
 * @param studentId - The student's user ID
 * @param batchId - The student's batch ID
 * @returns Promise<SubscriptionValidationResult>
 */
export const validateStudentSubscription = async (
  studentId: string, 
  batchId: string
): Promise<SubscriptionValidationResult> => {
  try {
    console.log(`🔍 Validating subscription for student: ${studentId}, batch: ${batchId}`);

    // 1. Check if student exists and has a batch assigned
    const student = await User.findById(studentId);
    if (!student) {
      console.log('❌ Student not found');
      return { valid: false, reason: 'Student not found' };
    }

    if (!student.batch) {
      console.log('❌ Student not assigned to any batch');
      return { valid: false, reason: 'Student not assigned to any batch' };
    }

    // 2. Check if the batch is assigned to any subscription plan
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: batchId,
      isActive: true
    }).populate('subscriptionPlan');

    if (!batchAssignment) {
      console.log('❌ Batch not assigned to any subscription plan');
      return { 
        valid: false, 
        reason: 'This batch is not assigned to any subscription plan',
        batchNotAssigned: true
      };
    }

    console.log(`✅ Batch assigned to subscription plan: ${batchAssignment.subscriptionPlan.name}`);

    // 3. Check if student has any subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: studentId
    }).populate('plan');

    if (!studentSubscription) {
      console.log('❌ Student has no subscription');
      return { 
        valid: false, 
        reason: 'No subscription found. Please subscribe to access exams.',
        subscriptionPlan: batchAssignment.subscriptionPlan,
        hasActiveSubscription: false
      };
    }

    // 4. Check if subscription is active and not expired
    const now = new Date();
    const isExpired = studentSubscription.endDate < now;
    
    if (isExpired) {
      console.log('❌ Student subscription has expired');
      return { 
        valid: false, 
        reason: 'Your subscription has expired. Please renew to access exams.',
        subscriptionPlan: batchAssignment.subscriptionPlan,
        currentSubscription: studentSubscription,
        subscriptionExpired: true
      };
    }

    if (studentSubscription.status !== 'active') {
      console.log(`❌ Student subscription status: ${studentSubscription.status}`);
      return { 
        valid: false, 
        reason: `Your subscription is ${studentSubscription.status}. Please contact support.`,
        subscriptionPlan: batchAssignment.subscriptionPlan,
        currentSubscription: studentSubscription
      };
    }

    // 5. Check if student's subscription matches the batch's assigned plan
    if (studentSubscription.plan._id.toString() !== batchAssignment.subscriptionPlan._id.toString()) {
      console.log('❌ Subscription plan mismatch');
      return { 
        valid: false, 
        reason: 'Your current subscription plan does not match the required plan for this batch.',
        requiredPlan: batchAssignment.subscriptionPlan,
        currentSubscription: studentSubscription
      };
    }

    console.log('✅ Student subscription is valid');
    return { 
      valid: true, 
      subscription: studentSubscription,
      subscriptionPlan: batchAssignment.subscriptionPlan
    };

  } catch (error) {
    console.error('❌ Subscription validation error:', error);
    return { valid: false, reason: 'Subscription validation failed. Please try again.' };
  }
};

/**
 * Get subscription status for a student (for dashboard display)
 * @param studentId - The student's user ID
 * @returns Promise<any>
 */
export const getStudentSubscriptionStatus = async (studentId: string) => {
  try {
    const student = await User.findById(studentId);
    if (!student || !student.batch) {
      return null;
    }

    // Get batch assignment
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: student.batch,
      isActive: true
    }).populate('subscriptionPlan');

    if (!batchAssignment) {
      return {
        hasAssignment: false,
        message: 'No subscription plan assigned to your batch'
      };
    }

    // Get student subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: studentId
    }).populate('plan');

    if (!studentSubscription) {
      return {
        hasAssignment: true,
        hasSubscription: false,
        requiredPlan: batchAssignment.subscriptionPlan,
        message: 'Please subscribe to access exams'
      };
    }

    const now = new Date();
    const isExpired = studentSubscription.endDate < now;
    const daysUntilExpiry = Math.ceil((studentSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasAssignment: true,
      hasSubscription: true,
      subscription: studentSubscription,
      requiredPlan: batchAssignment.subscriptionPlan,
      isExpired,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
      status: studentSubscription.status,
      message: isExpired ? 'Subscription expired' : `Active (${daysUntilExpiry} days remaining)`
    };

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};
