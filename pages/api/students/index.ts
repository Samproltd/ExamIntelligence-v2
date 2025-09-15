import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI, requireAdmin } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Result from '../../../models/Result';
import Batch from '../../../models/Batch';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../utils/mongooseUtils';

// Define interfaces for type safety
interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: string;
  rollNumber?: string;
  batch?: mongoose.Types.ObjectId;
  createdAt: Date;
  toObject(): any;
}

interface IBatch {
  _id: mongoose.Types.ObjectId;
  name: string;
  year: number;
  isActive: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // The admin check is already handled by the requireAdmin middleware
  // This is just an extra check
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  // GET - Fetch students with optional pagination and search
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const batchId = req.query.batch as string;

      const skip = (page - 1) * limit;

      // Build search query
      let query: any = { role: 'student' };

      // Filter by batch if provided
      if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
        query.batch = batchId;
      }

      if (search) {
        query = {
          ...query,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { rollNumber: { $regex: search, $options: 'i' } },
          ],
        };
      }

      // Count total students for pagination
      const total = await mongooseUtils.countDocuments(User, query);

      // Fetch students
      const students = await mongooseUtils.find<any, IUser>(
        User,
        query,
        'name email rollNumber batch createdAt isBlocked',
        {
          sort: { createdAt: -1 },
          skip,
          limit,
        }
      );

      // Manually populate batch info if needed
      // This is a workaround for schema validation issues during development
      if (students.length > 0 && students[0].batch) {
        const batchIds = students.filter(student => student.batch).map(student => student.batch);

        if (batchIds.length > 0) {
          const batches = await mongooseUtils.find<any, IBatch>(
            Batch,
            { _id: { $in: batchIds } },
            'name year'
          );

          const batchMap = new Map();
          batches.forEach(batch => {
            batchMap.set(batch._id.toString(), {
              _id: batch._id,
              name: batch.name,
              year: batch.year,
            });
          });

          // Add batch info to students
          students.forEach(student => {
            if (student.batch) {
              const batchId = student.batch.toString();
              if (batchMap.has(batchId)) {
                // We're intentionally modifying the object directly
                student._doc.batch = batchMap.get(batchId);
              }
            }
          });
        }
      }

      // Get exam statistics for each student
      const studentIds = students.map(student => student._id);
      const results = await Result.aggregate([
        { $match: { student: { $in: studentIds } } },
        {
          $group: {
            _id: '$student',
            examsTaken: { $sum: 1 },
            totalScore: { $sum: '$percentage' },
          },
        },
      ]);

      // Map results to students
      const resultsMap = new Map(results.map(result => [result._id.toString(), result]));

      const studentsWithStats = students.map(student => {
        const studentObj = student.toObject();
        const stats = resultsMap.get(student._id.toString());

        studentObj.examsTaken = stats ? stats.examsTaken : 0;
        studentObj.averageScore =
          stats && stats.examsTaken > 0 ? stats.totalScore / stats.examsTaken : 0;

        return studentObj;
      });

      // Get all batches for the filter dropdown
      const batches = await mongooseUtils.find<any, IBatch>(
        Batch,
        { isActive: true },
        'name year',
        { sort: { year: -1, name: 1 } }
      );

      return res.status(200).json({
        success: true,
        students: studentsWithStats,
        batches,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // POST - Create a new student
  if (req.method === 'POST') {
    try {
      const { name, email, password, rollNumber, batchId } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email and password',
        });
      }

      // Check if email is already in use
      const existingUser = await mongooseUtils.findOne<any, IUser>(User, {
        email,
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      // Validate batch if provided
      if (batchId && !mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid batch ID',
        });
      }

      // Create the student
      const student = await mongooseUtils.create<any, IUser>(User, {
        name,
        email,
        password,
        role: 'student',
        rollNumber: rollNumber || undefined,
        batch: batchId || undefined,
      });

      // Remove password from response
      const studentResponse = student.toObject();
      delete studentResponse.password;

      return res.status(201).json({
        success: true,
        student: studentResponse,
      });
    } catch (error: any) {
      console.error('Error creating student:', error);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }

      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default requireAdmin(authenticateAPI(handler));
