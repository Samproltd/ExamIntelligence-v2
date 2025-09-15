import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI, requireAdmin } from '../../../utils/auth';
import dbConnect, { preloadModels } from '../../../utils/db';
import Batch from '../../../models/Batch';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  // Ensure all models are loaded
  await preloadModels();

  // GET - Fetch all batches or filter by params
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', sort = '-createdAt', search = '' } = req.query;

      // Convert to numbers
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      let query: any = {};

      // Add search if provided
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        };
      }

      // Get total count for pagination
      const total = await mongooseUtils.countDocuments(Batch, query);

      // Execute query with pagination and sorting
      const batches = await Batch.find(query)
        .sort(sort as string)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email');

      return res.status(200).json({
        success: true,
        total,
        page: pageNum,
        limit: limitNum,
        batches,
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // POST - Create a new batch (admin only)
  if (req.method === 'POST') {
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
      console.log('req.body--->', req.body);

      // Validate required fields
      if (!name || !description || !year) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, description, and year',
        });
      }

      // Ensure numeric values are explicitly set with defaults
      const validatedMaxAttempts = maxAttempts !== undefined ? parseInt(maxAttempts) : 3;
      const validatedMaxSecurityIncidents =
        maxSecurityIncidents !== undefined ? parseInt(maxSecurityIncidents) : 5;
      const validatedAdditionalSecurityIncidents =
        additionalSecurityIncidentsAfterRemoval !== undefined
          ? parseInt(additionalSecurityIncidentsAfterRemoval)
          : 3;
      const validatedAdditionalAttempts =
        additionalAttemptsAfterPayment !== undefined ? parseInt(additionalAttemptsAfterPayment) : 2;

      console.log('Creating batch with security settings:', {
        maxAttempts: validatedMaxAttempts,
        maxSecurityIncidents: validatedMaxSecurityIncidents,
        enableAutoSuspend,
        additionalSecurityIncidentsAfterRemoval: validatedAdditionalSecurityIncidents,
        additionalAttemptsAfterPayment: validatedAdditionalAttempts,
      });

      // Create the batch
      const batch = await mongooseUtils.create(Batch, {
        name,
        description,
        year,
        isActive: isActive !== undefined ? isActive : true,
        maxAttempts: validatedMaxAttempts,
        maxSecurityIncidents: validatedMaxSecurityIncidents,
        enableAutoSuspend: enableAutoSuspend !== undefined ? enableAutoSuspend : true,
        additionalSecurityIncidentsAfterRemoval: validatedAdditionalSecurityIncidents,
        additionalAttemptsAfterPayment: validatedAdditionalAttempts,
        createdBy: req.user?.userId,
      });

      return res.status(201).json({
        success: true,
        batch,
      });
    } catch (error: any) {
      console.error('Error creating batch:', error);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }

      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // If method not allowed
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default requireAdmin(authenticateAPI(handler));
