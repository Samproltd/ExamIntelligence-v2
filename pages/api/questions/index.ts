import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Question from '../../../models/Question';
import { verifyToken } from '../../../utils/auth';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  if (req.method === 'GET') {
    return await getQuestions(req, res);
  }

  if (req.method === 'POST') {
    return await createQuestion(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getQuestions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (category) {
      query.category = category;
    }

    const questions = await (Question as any).find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .exec();

    const total = await (Question as any).countDocuments(query).exec();

    return res.status(200).json({
      success: true,
      questions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching questions',
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

async function createQuestion(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

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

    const question = new Question({
      text: text.trim(),
      category: category.trim(),
      options: options.map((option: any) => ({
        text: option.text.trim(),
        isCorrect: option.isCorrect,
      })),
      createdBy: decoded.userId,
    });

    await question.save();

    const populatedQuestion = await (Question as any).findById(question._id)
      .populate('createdBy', 'name email')
      .exec();

    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: populatedQuestion,
    });
  } catch (error: any) {
    console.error('Error creating question:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message,
    });
  }
}

export default handler;
