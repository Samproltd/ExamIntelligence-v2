import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Exam from '../../../models/Exam';
import Question from '../../../models/Question';
import Result from '../../../models/Result';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

// Define interfaces for type safety
interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  course: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  assignedBatches?: mongoose.Types.ObjectId[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  // Explicitly preload models to ensure they're registered
  await preloadModels();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid exam ID' });
  }

  // GET - Fetch a single exam
  if (req.method === 'GET') {
    try {
      // Ensure all models are loaded

      const exam = await mongooseUtils.findById(Exam, id as string, {
        populate: [
          {
            path: 'course',
            select: 'name subject',
            populate: {
              path: 'subject',
              select: 'name',
            },
          },
          { path: 'assignedBatches', select: 'name description year' },
        ],
      });

      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      return res.status(200).json({
        success: true,
        exam,
      });
    } catch (error) {
      console.error('Error fetching exam:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // For methods other than GET, ensure the user is authenticated
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // PUT - Update an exam (admin only)
  if (req.method === 'PUT') {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    try {
      const {
        name,
        description,
        duration,
        totalMarks,
        passPercentage,
        assignedBatches,
        totalQuestions,
        questionsToDisplay,
        course,
        maxAttempts,
        examType,
        proctoringLevel,
      } = req.body;

      // Validate input
      if (
        !name ||
        !description ||
        !duration ||
        !totalMarks ||
        !totalQuestions ||
        !questionsToDisplay ||
        !course
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
      }

      // Validate questionsToDisplay is not greater than totalQuestions
      if (questionsToDisplay > totalQuestions) {
        return res.status(400).json({
          success: false,
          message: 'Number of questions to display cannot be greater than total questions',
        });
      }

      // Validate assigned batches if provided
      if (assignedBatches && !Array.isArray(assignedBatches)) {
        return res.status(400).json({
          success: false,
          message: 'Assigned batches must be an array',
        });
      }

      // Get current exam to check the course
      const currentExam = await mongooseUtils.findById<any, IExam>(Exam, id as string);

      if (!currentExam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Check if exam with same name already exists in this course (excluding current exam)
      const existingExam = await mongooseUtils.findOne(Exam, {
        name,
        course: course,
        _id: { $ne: id },
      });

      if (existingExam) {
        return res.status(400).json({
          success: false,
          message: 'Exam with this name already exists in the same course',
        });
      }

      // Prepare update object
      const updateData: any = {
        name,
        description,
        duration,
        totalMarks,
        passPercentage: passPercentage || 40, // Default to 40% if not provided
        totalQuestions,
        questionsToDisplay,
        course,
        maxAttempts: maxAttempts || 1, // Default to 1 attempt if not provided
        examType: examType || 'assessment', // Default to assessment if not provided
        proctoringLevel: proctoringLevel || 'basic', // Default to basic if not provided
      };

      if (assignedBatches) {
        updateData.assignedBatches = assignedBatches;
      }

      // Update the exam
      const updatedExam = await mongooseUtils.findByIdAndUpdate<any, IExam>(
        Exam,
        id as string,
        updateData,
        { new: true }
      );

      if (!updatedExam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      // Populate the exam with related data
      const populatedExam = await Exam.findById(updatedExam._id)
        .populate({
          path: 'course',
          select: 'name subject',
          populate: {
            path: 'subject',
            select: 'name college',
            populate: {
              path: 'college',
              select: 'name code'
            }
          },
        })
        .populate('college', 'name code')
        .populate('createdBy', 'name email')
        .populate('assignedBatches', 'name description year');

      return res.status(200).json({
        success: true,
        exam: populatedExam,
      });
    } catch (error: any) {
      console.error('Error updating exam:', error);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }

      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // DELETE - Delete an exam and all related data (admin only)
  if (req.method === 'DELETE') {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find the exam
        const exam = await mongooseUtils.findById(Exam, id as string, {
          session,
        });

        if (!exam) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        // Delete all results for this exam
        await mongooseUtils.deleteMany(Result, { exam: id }, { session });

        // Delete all questions for this exam
        await mongooseUtils.deleteMany(Question, { exam: id }, { session });

        // Delete the exam
        await mongooseUtils.findByIdAndDelete(Exam, id as string, { session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: 'Exam and all related data deleted successfully',
        });
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

// Wrap the handler with a modified middleware that doesn't enforce authentication for GET requests
const modifiedHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Check for authorization header to optionally authenticate
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { verifyToken } = await import('../../../utils/auth');
      const decoded = verifyToken(token);

      if (decoded) {
        // Add user info to the request object
        req.user = decoded;
      }
    }

    return handler(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export default modifiedHandler;
