import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Question from '../../../models/Question';
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid question ID' });
  }

  if (req.method === 'GET') {
    return await getQuestion(req, res);
  }

  if (req.method === 'PUT') {
    return await updateQuestion(req, res);
  }

  if (req.method === 'DELETE') {
    return await deleteQuestion(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getQuestion(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const question = await (Question as any).findById(id)
      .populate('createdBy', 'name email')
      .exec();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching question',
    });
  }
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

async function updateQuestion(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { id } = req.query;
    const { text, category, options } = req.body;

    // Validate input
    if (!text || !category || !options || !Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question text, category, and options',
      });
    }

    // Validate options
    if (options.length < 2 || options.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Questions must have 2-6 options',
      });
    }

    // Ensure at least one option is correct
    if (!options.some((option: any) => option.isCorrect)) {
      return res.status(400).json({
        success: false,
        message: 'At least one option must be marked as correct',
      });
    }

    // Validate option text
    for (const option of options) {
      if (!option.text || !option.text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'All options must have text',
        });
      }
    }

    const question = await (Question as any).findById(id).exec();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Update question
    question.text = text.trim();
    question.category = category.trim();
    question.options = options.map((option: any) => ({
      text: option.text.trim(),
      isCorrect: option.isCorrect,
    }));

    await question.save();

    const updatedQuestion = await (Question as any).findById(question._id)
      .populate('createdBy', 'name email')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Error updating question:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message,
    });
  }
}

async function deleteQuestion(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { id } = req.query;
    const question = await (Question as any).findById(id).exec();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await (Question as any).findByIdAndDelete(id).exec();

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message,
    });
  }
}

export default handler;
