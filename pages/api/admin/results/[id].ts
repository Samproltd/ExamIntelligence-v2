import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect, { preloadModels } from '../../../../utils/db';
import Result from '../../../../models/Result';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  // Get result ID from the URL
  const { id } = req.query;

  // Validate the ID format
  if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid result ID' });
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Find the result by ID with populated references
      const result = await mongooseUtils.findById(Result, id as string, {
        populate: [
          {
            path: 'student',
            select: 'name email phone batch',
            populate: { path: 'batch', select: 'name year' },
          },
          {
            path: 'exam',
            select: 'name description duration totalMarks passPercentage',
            populate: { path: 'course', select: 'name' },
          },
          {
            path: 'answers.question',
            select: 'text questionText options correctAnswer marks',
          },
        ],
      });

      if (!result) {
        return res.status(404).json({ success: false, message: 'Result not found' });
      }

      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('Error fetching result details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
