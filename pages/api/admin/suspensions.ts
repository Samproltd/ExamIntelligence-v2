import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import ExamSuspension from '../../../models/ExamSuspension';

// Make sure all models are loaded
import '../../../models/Subject';
import '../../../models/Course';
import '../../../models/Batch';
import '../../../models/Question';
import '../../../models/Result';
import '../../../models/Setting';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only admins can see all suspensions
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can view all suspensions',
    });
  }

  // GET - Fetch all suspensions
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, exam, student, status } = req.query;
      
      // Build query
      const query: any = {};
      if (exam) query.exam = exam;
      if (student) query.student = student;
      if (status) query.removed = status === 'removed';
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get suspensions with pagination
      const suspensions = await ExamSuspension.find(query)
        .populate({
          path: 'student',
          select: 'name email batch',
        })
        .populate({
          path: 'exam',
          select: 'name',
          populate: {
            path: 'course',
            select: 'name',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await ExamSuspension.countDocuments(query);

      return res.status(200).json({
        success: true,
        suspensions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // POST - Create new suspension
  if (req.method === 'POST') {
    try {
      const { studentId, examId, reason, duration } = req.body;

      if (!studentId || !examId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Student ID, Exam ID, and reason are required',
        });
      }

      const suspension = new ExamSuspension({
        student: studentId,
        exam: examId,
        reason,
        duration: duration || 24, // Default 24 hours
        suspendedAt: new Date(),
        removed: false,
      });

      await suspension.save();

      return res.status(201).json({
        success: true,
        message: 'Suspension created successfully',
        suspension,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // DELETE - Remove suspension
  if (req.method === 'DELETE') {
    try {
      const { suspensionId } = req.body;

      if (!suspensionId) {
        return res.status(400).json({
          success: false,
          message: 'Suspension ID is required',
        });
      }

      const suspension = await ExamSuspension.findById(suspensionId);
      if (!suspension) {
        return res.status(404).json({
          success: false,
          message: 'Suspension not found',
        });
      }

      suspension.removed = true;
      suspension.removedAt = new Date();
      await suspension.save();

      return res.status(200).json({
        success: true,
        message: 'Suspension removed successfully',
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
