import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI, requireAdmin } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Batch from '../../../models/Batch';
import User from '../../../models/User';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid batch ID' });
  }

  // GET - Fetch a single batch
  if (req.method === 'GET') {
    try {
      const batch = await Batch.findById(id).populate('createdBy', 'name email');

      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      // Debug logging
      console.log('BATCH DETAILS:', {
        _id: batch._id,
        name: batch.name,
        maxAttempts: batch.maxAttempts,
        maxAttemptsType: typeof batch.maxAttempts,
        maxSecurityIncidents: batch.maxSecurityIncidents,
        enableAutoSuspend: batch.enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval: batch.additionalSecurityIncidentsAfterRemoval,
        additionalAttemptsAfterPayment: batch.additionalAttemptsAfterPayment,
      });

      // Log the full batch object for debugging
      console.log('FULL BATCH OBJECT:', JSON.stringify(batch, null, 2));

      // Get students associated with this batch
      const students = await mongooseUtils.find(
        User,
        { batch: id, role: 'student' },
        'name email rollNumber createdAt'
      );

      return res.status(200).json({
        success: true,
        batch,
        students,
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // PUT - Update a batch (admin only)
  if (req.method === 'PUT') {
    try {
      const {
        name,
        description,
        year,
        isActive,
        maxAttempts,
        maxSecurityIncidents,
        enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval,
        additionalAttemptsAfterPayment,
      } = req.body;

      // Debug logging
      console.log('UPDATE BATCH REQUEST BODY:', req.body);
      console.log('maxAttempts value:', maxAttempts, 'type:', typeof maxAttempts);

      // Validate required fields
      if (
        !name &&
        !description &&
        !year &&
        isActive === undefined &&
        maxAttempts === undefined &&
        maxSecurityIncidents === undefined &&
        enableAutoSuspend === undefined &&
        additionalSecurityIncidentsAfterRemoval === undefined &&
        additionalAttemptsAfterPayment === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one field to update',
        });
      }

      // Parse numeric values if provided
      const updateMaxAttempts = maxAttempts !== undefined ? parseInt(maxAttempts) : undefined;
      const updateMaxSecurityIncidents =
        maxSecurityIncidents !== undefined ? parseInt(maxSecurityIncidents) : undefined;
      const updateAdditionalSecurityIncidents =
        additionalSecurityIncidentsAfterRemoval !== undefined
          ? parseInt(additionalSecurityIncidentsAfterRemoval)
          : undefined;
      const updateAdditionalAttempts =
        additionalAttemptsAfterPayment !== undefined
          ? parseInt(additionalAttemptsAfterPayment)
          : undefined;

      console.log('Security settings for update:', {
        maxSecurityIncidents: updateMaxSecurityIncidents,
        enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval: updateAdditionalSecurityIncidents,
        additionalAttemptsAfterPayment: updateAdditionalAttempts,
      });

      // Find and update the batch
      const batch = await Batch.findByIdAndUpdate(
        id,
        {
          ...(name && { name }),
          ...(description && { description }),
          ...(year && { year }),
          ...(isActive !== undefined && { isActive }),
          ...(updateMaxAttempts !== undefined && { maxAttempts: updateMaxAttempts }),
          ...(updateMaxSecurityIncidents !== undefined && {
            maxSecurityIncidents: updateMaxSecurityIncidents,
          }),
          ...(enableAutoSuspend !== undefined && { enableAutoSuspend }),
          ...(updateAdditionalSecurityIncidents !== undefined && {
            additionalSecurityIncidentsAfterRemoval: updateAdditionalSecurityIncidents,
          }),
          ...(updateAdditionalAttempts !== undefined && {
            additionalAttemptsAfterPayment: updateAdditionalAttempts,
          }),
        },
        { new: true, runValidators: true }
      );

      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      return res.status(200).json({
        success: true,
        batch,
      });
    } catch (error: any) {
      console.error('Error updating batch:', error);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }

      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // DELETE - Delete a batch (admin only)
  if (req.method === 'DELETE') {
    try {
      // Check if the batch has associated students
      const studentCount = await User.countDocuments({ batch: id });

      if (studentCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete batch with ${studentCount} associated students. Please remove or reassign them first.`,
        });
      }

      // Find and delete the batch
      const batch = await Batch.findByIdAndDelete(id);

      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Batch deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // If method not allowed
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default requireAdmin(authenticateAPI(handler));
