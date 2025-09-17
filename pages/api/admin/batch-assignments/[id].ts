import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import BatchSubscriptionAssignment from '../../../../models/BatchSubscriptionAssignment';
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

    const { id } = req.query;

    if (req.method === 'GET') {
      const assignment = await BatchSubscriptionAssignment.findById(id)
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

      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      return res.status(200).json({
        success: true,
        data: assignment,
      });
    }

    if (req.method === 'PUT') {
      const { isActive, notes } = req.body;

      const assignment = await BatchSubscriptionAssignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      // Update fields
      if (typeof isActive === 'boolean') {
        assignment.isActive = isActive;
      }
      if (notes !== undefined) {
        assignment.notes = notes;
      }

      await assignment.save();

      // Return populated assignment
      const updatedAssignment = await BatchSubscriptionAssignment.findById(id)
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

      return res.status(200).json({
        success: true,
        data: updatedAssignment,
        message: 'Assignment updated successfully'
      });
    }

    if (req.method === 'DELETE') {
      const assignment = await BatchSubscriptionAssignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      await BatchSubscriptionAssignment.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Batch assignment API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
