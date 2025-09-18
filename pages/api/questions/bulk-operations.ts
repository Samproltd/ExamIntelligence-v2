import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Question from '../../../models/Question';
import { verifyToken } from '../../../utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  if (req.method === 'DELETE') {
    return await bulkDeleteQuestions(req, res);
  }

  if (req.method === 'PUT') {
    return await bulkUpdateQuestions(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

// Helper function to authenticate and get decoded token
async function authenticateUser(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return null;
  }

  return decoded;
}

async function bulkDeleteQuestions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs array is required',
      });
    }

    // Validate all IDs are valid ObjectIds
    const mongoose = require('mongoose');
    const invalidIds = questionIds.filter((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question IDs provided',
        invalidIds,
      });
    }

    // Delete questions
    const result = await (Question as any).deleteMany({
      _id: { $in: questionIds }
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} questions deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error bulk deleting questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting questions',
      error: error.message,
    });
  }
}

async function bulkUpdateQuestions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { questionIds, updates } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs array is required',
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required',
      });
    }

    // Validate all IDs are valid ObjectIds
    const mongoose = require('mongoose');
    const invalidIds = questionIds.filter((id: string) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question IDs provided',
        invalidIds,
      });
    }

    // Validate updates
    const allowedFields = ['category'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update fields provided',
        invalidFields,
        allowedFields,
      });
    }

    // Update questions
    const result = await (Question as any).updateMany(
      { _id: { $in: questionIds } },
      { $set: updates }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} questions updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Error bulk updating questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating questions',
      error: error.message,
    });
  }
}

export default handler;
