import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
import Batch from '../../../../models/Batch';
import SubscriptionPlan from '../../../../models/SubscriptionPlan';
import College from '../../../../models/College';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Only admin can access this endpoint
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.method === 'GET') {
      // Get all batch assignments with populated data
      const assignments = await BatchSubscriptionAssignment.find()
        .populate({
          path: 'batch',
          populate: {
            path: 'college',
            select: 'name code'
          }
        })
        .populate('subscriptionPlan', 'name price duration')
        .populate('college', 'name code')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    }

    if (req.method === 'POST') {
      const { college, batch, subscriptionPlan, notes } = req.body;

      // Validate required fields
      if (!college || !batch || !subscriptionPlan) {
        return res.status(400).json({ 
          success: false, 
          message: 'College, batch, and subscription plan are required' 
        });
      }

      // Check if assignment already exists
      const existingAssignment = await BatchSubscriptionAssignment.findOne({
        batch,
        subscriptionPlan
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'This batch is already assigned to this subscription plan'
        });
      }

      // Verify that the batch belongs to the specified college
      const batchDoc = await Batch.findById(batch);
      if (!batchDoc) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      if (batchDoc.college.toString() !== college) {
        return res.status(400).json({
          success: false,
          message: 'Batch does not belong to the specified college'
        });
      }

      // Verify subscription plan exists
      const planDoc = await SubscriptionPlan.findById(subscriptionPlan);
      if (!planDoc) {
        return res.status(404).json({ success: false, message: 'Subscription plan not found' });
      }

      // Create the assignment
      const assignment = new BatchSubscriptionAssignment({
        batch,
        subscriptionPlan,
        college,
        assignedBy: decoded.userId,
        notes: notes || undefined
      });

      await assignment.save();

      // Populate the created assignment for response
      const populatedAssignment = await BatchSubscriptionAssignment.findById(assignment._id)
        .populate({
          path: 'batch',
          populate: {
            path: 'college',
            select: 'name code'
          }
        })
        .populate('subscriptionPlan', 'name price duration')
        .populate('college', 'name code')
        .populate('assignedBy', 'name email');

      return res.status(201).json({
        success: true,
        data: populatedAssignment,
        message: 'Batch assignment created successfully'
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Batch assignments API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
