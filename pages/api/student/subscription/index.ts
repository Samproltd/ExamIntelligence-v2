import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import User from '../../../../models/User';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import StudentSubscription from '../../../../models/StudentSubscription';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
import { getStudentSubscriptionStatus } from '../../../../utils/subscriptionValidation';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    if (req.method === 'GET') {
      // Get student's subscription status and available plans
      const student = await User.findById(req.user.userId);
      if (!student || !student.batch) {
        return res.status(400).json({
          success: false,
          message: 'Student not found or not assigned to any batch'
        });
      }

      // Get subscription status
      const subscriptionStatus = await getStudentSubscriptionStatus(req.user.userId);

      // Get available plans (only the one assigned to student's batch)
      let availablePlans = [];
      if (subscriptionStatus?.hasAssignment && !subscriptionStatus.hasSubscription) {
        // Get the required plan for this batch
        const batchAssignment = await BatchSubscriptionAssignment.findOne({
          batch: student.batch,
          isActive: true
        }).populate('subscriptionPlan');

        if (batchAssignment) {
          availablePlans = [batchAssignment.subscriptionPlan];
        }
      }

      return res.status(200).json({
        success: true,
        subscriptionStatus,
        availablePlans
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in student subscription API:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export default authenticateAPI(handler);
