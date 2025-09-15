import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import Result from '../../../models/Result';
import Batch from '../../../models/Batch';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as mongooseUtils from '../../../utils/mongooseUtils';

// Define interfaces for type safety
interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  rollNumber?: string;
  mobile?: string;
  dateOfBirth?: string;
  batch?: mongoose.Types.ObjectId;
  role: string;
  createdAt: Date;
  isBlocked: boolean;
}

interface IResult {
  _id: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  score: number;
  percentage: number;
  passed: boolean;
  createdAt: Date;
}

interface IBatch {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  year: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID' });
  }

  // GET - Fetch a single student with their exam results
  if (req.method === 'GET') {
    try {
      // Fetch the student with batch information
      const student = await mongooseUtils.findOne<any, IUser>(
        User,
        {
          _id: id,
          role: 'student',
        },
        'name firstName lastName email rollNumber mobile dateOfBirth batch createdAt isBlocked',
        {
          populate: {
            path: 'batch',
            select: 'name',
          },
        }
      );

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Fetch all results for this student
      const results = await mongooseUtils.find<any, IResult>(Result, { student: id }, null, {
        sort: { createdAt: -1 },
        populate: {
          path: 'exam',
          select: 'name course',
          populate: {
            path: 'course',
            select: 'name subject',
            populate: {
              path: 'subject',
              select: 'name',
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        student,
        results,
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // PUT - Update a student
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { name, email, rollNumber, batch, password, isBlocked } = req.body;

      // Check if student exists
      const existingStudent = await mongooseUtils.findOne<any, IUser>(User, {
        _id: id,
        role: 'student',
      });

      if (!existingStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Check if email already exists for another user
      if (email && email !== existingStudent.email) {
        const emailExists = await mongooseUtils.findOne(User, {
          email,
          _id: { $ne: id },
        });

        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }

      // Prepare update object
      const updateData: any = {};
      if (name) updateData.name = name;
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
      if (email) updateData.email = email;
      if (rollNumber !== undefined) updateData.rollNumber = rollNumber || undefined;
      if (req.body.mobile !== undefined) updateData.mobile = req.body.mobile;
      if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth;
      if (isBlocked !== undefined) updateData.isBlocked = isBlocked;

      // Handle batch assignment
      if (batch) {
        const batchExists = await mongooseUtils.findById<any, IBatch>(Batch, batch);
        if (!batchExists) {
          return res.status(400).json({ success: false, message: 'Invalid batch ID' });
        }
        updateData.batch = batch;
      } else if (req.body.batchId === null || batch === null || batch === '') {
        // Remove batch assignment - ensure we set it to null, not undefined
        // Using $unset to completely remove the field from the document
        await mongooseUtils.findByIdAndUpdate<any, IUser>(
          User,
          id as string,
          { $unset: { batch: 1 } },
          { new: false }
        );

        updateData.batch = null;
        updateData.rollNumber = undefined;
      }

      // Handle password update
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      // Update the student
      const updatedStudent = await mongooseUtils.findByIdAndUpdate<any, IUser>(
        User,
        id as string,
        { $set: updateData },
        {
          new: true,
          select:
            'name firstName lastName email rollNumber mobile dateOfBirth batch createdAt isBlocked',
          populate: { path: 'batch', select: 'name' },
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        student: updatedStudent,
      });
    } catch (error) {
      console.error('Error updating student:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // DELETE - Delete a student
  if (req.method === 'DELETE') {
    try {
      // Check if student exists
      const existingStudent = await mongooseUtils.findOne<any, IUser>(User, {
        _id: id,
        role: 'student',
      });

      if (!existingStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Delete the student
      await mongooseUtils.findByIdAndDelete(User, id as string);

      // Optional: Delete associated results
      await mongooseUtils.deleteMany(Result, { student: id });

      return res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
