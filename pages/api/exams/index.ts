import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect, { preloadModels } from '../../../utils/db';
import Exam from '../../../models/Exam';
import Course from '../../../models/Course';
import Result from '../../../models/Result';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  course: mongoose.Types.ObjectId | ICourse;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number;
  questionsToDisplay: number;
  assignedBatches?: mongoose.Types.ObjectId[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toObject(): any;
}

interface IResult {
  _id: mongoose.Types.ObjectId;
  student: string;
  exam: mongoose.Types.ObjectId;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    // Ensure all models are loaded
    await preloadModels();

    // GET - Fetch all exams with optional course filter
    if (req.method === 'GET') {
      const { course, batch } = req.query;
      const query: any = {};
      // Filter by course if provided
      if (course) {
        if (!mongoose.Types.ObjectId.isValid(course as string)) {
          return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }
        query.course = course;
      }
      // Filter by batch if provided
      if (batch) {
        if (!mongoose.Types.ObjectId.isValid(batch as string)) {
          return res.status(400).json({ success: false, message: 'Invalid batch ID' });
        }
        query.assignedBatches = batch;
      }

      // For students, we need to check which exams they've already taken
      if (req.user.role === 'student') {
        const exams = await Exam.find(query)
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
          .populate('assignedBatches', 'name description year')
          .sort({ createdAt: -1 });

        // Find results for this student
        const results = await mongooseUtils.find<any, IResult>(Result, {
          student: req.user.userId,
        });
        const examsTaken = new Set(results.map(result => result.exam.toString()));

        // Add hasTaken flag to each exam
        const examsWithTakenStatus = exams.map(exam => {
          const examObj = exam.toObject();
          examObj.hasTaken = examsTaken.has(exam._id.toString());
          return examObj;
        });

        return res.status(200).json({
          success: true,
          exams: examsWithTakenStatus,
        });
      } else {
        // For admins, just return all exams
        const exams = await Exam.find(query)
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
          .populate('assignedBatches', 'name description year')
          .sort({ createdAt: -1 });

        return res.status(200).json({
          success: true,
          exams,
        });
      }
    }

    // POST - Create a new exam (admin only)
    if (req.method === 'POST') {
      // Check if user is an admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      try {
        const {
          name,
          description,
          course,
          duration,
          totalMarks,
          passPercentage,
          totalQuestions,
          questionsToDisplay,
          maxAttempts,
          examType,
          proctoringLevel,
          assignedBatches,
        } = req.body;

        // Validate input
        if (
          !name ||
          !description ||
          !course ||
          !duration ||
          !totalMarks ||
          !totalQuestions ||
          !questionsToDisplay
        ) {
          return res.status(400).json({
            success: false,
            message: 'Please provide all required fields',
          });
        }

        // Validate course ID
        if (!mongoose.Types.ObjectId.isValid(course)) {
          return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        // Validate questionsToDisplay is not greater than totalQuestions
        if (questionsToDisplay > totalQuestions) {
          return res.status(400).json({
            success: false,
            message: 'Number of questions to display cannot be greater than total questions',
          });
        }

        // Check if course exists and get its college
        const existingCourse = await Course.findById(course)
          .populate({
            path: 'subject',
            populate: {
              path: 'college'
            }
          });

        if (!existingCourse) {
          return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Get college from the course's subject
        const college = (existingCourse as any).subject.college._id;

        // Check if exam with same name already exists in this course
        const existingExam = await mongooseUtils.findOne<any, IExam>(Exam, {
          name,
          course,
        });

        if (existingExam) {
          return res.status(400).json({
            success: false,
            message: 'Exam with this name already exists in the selected course',
          });
        }

        // Create the exam with college from course's subject
        const exam = await mongooseUtils.create<any, IExam>(Exam, {
          name,
          description,
          course,
          college, // Add college from the course's subject
          duration,
          totalMarks,
          passPercentage: passPercentage || 40, // Default to 40% if not provided
          totalQuestions,
          questionsToDisplay,
          maxAttempts: maxAttempts || 1, // Default to 1 attempt if not provided
          examType: examType || 'assessment', // Default to assessment if not provided
          proctoringLevel: proctoringLevel || 'basic', // Default to basic if not provided
          assignedBatches: assignedBatches || [], // Default to empty array if not provided
          createdBy: req.user.userId,
        });

        // Populate the course and college fields for the response
        const populatedExam = await Exam.findById((exam as IExam)._id)
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

        return res.status(201).json({
          success: true,
          exam: populatedExam,
        });
      } catch (error: any) {
        console.error('Error creating exam:', error);

        // Check for validation errors
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err: any) => err.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export default authenticateAPI(handler);
