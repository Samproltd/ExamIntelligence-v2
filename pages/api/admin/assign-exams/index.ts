import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Batch from '../../../../models/Batch';
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

    if (req.method === 'POST') {
      const { examId, batchIds } = req.body;

      // Validate input
      if (!examId || !batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Exam ID and batch IDs are required'
        });
      }

      // Verify exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Verify all batches exist
      const batches = await Batch.find({ _id: { $in: batchIds } });
      if (batches.length !== batchIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more batches not found'
        });
      }

      // Get current assigned batches
      const currentBatches = exam.assignedBatches || [];
      
      // Add new batches (avoid duplicates)
      const newBatches = batchIds.filter(batchId => !currentBatches.includes(batchId));
      const updatedBatches = [...currentBatches, ...newBatches];

      // Update exam with new batch assignments
      await Exam.findByIdAndUpdate(examId, {
        assignedBatches: updatedBatches
      });

      return res.status(200).json({
        success: true,
        message: `Exam assigned to ${newBatches.length} new batch(es)`,
        data: {
          examId,
          newBatchesAssigned: newBatches.length,
          totalBatchesAssigned: updatedBatches.length
        }
      });
    }

    if (req.method === 'DELETE') {
      const { examId, batchId } = req.body;

      // Validate input
      if (!examId || !batchId) {
        return res.status(400).json({
          success: false,
          message: 'Exam ID and batch ID are required'
        });
      }

      // Verify exam exists
      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Remove batch from assigned batches
      const updatedBatches = (exam.assignedBatches || []).filter(
        id => id.toString() !== batchId
      );

      // Update exam
      await Exam.findByIdAndUpdate(examId, {
        assignedBatches: updatedBatches
      });

      return res.status(200).json({
        success: true,
        message: 'Batch assignment removed successfully'
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Assign exams API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
