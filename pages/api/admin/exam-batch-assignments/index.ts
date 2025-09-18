import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/db';
import Exam from '../../../../models/Exam';
import Batch from '../../../../models/Batch';
import User from '../../../../models/User';
import { verifyToken } from '../../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Only admin can access this endpoint
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all exams with assigned batches
    const exams = await Exam.find({ 
      assignedBatches: { $exists: true, $not: { $size: 0 } } 
    })
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
        }
      })
      .populate('college', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Create assignment objects for each exam-batch pair
    const assignments = [];
    
    for (const exam of exams) {
      if (exam.assignedBatches && exam.assignedBatches.length > 0) {
        // Get batch details for all assigned batches
        const batches = await Batch.find({
          _id: { $in: exam.assignedBatches }
        })
          .populate('subject', 'name')
          .populate('college', 'name code')
          .populate('createdBy', 'name email');

        // Create assignment record for each batch
        for (const batch of batches) {
          assignments.push({
            _id: `${exam._id}-${batch._id}`, // Composite ID
            exam: {
              _id: exam._id,
              name: exam.name,
              description: exam.description,
              course: exam.course,
              college: exam.college,
              duration: exam.duration,
              totalMarks: exam.totalMarks,
              assignedBatches: exam.assignedBatches,
              createdAt: exam.createdAt
            },
            batch: {
              _id: batch._id,
              name: batch.name,
              description: batch.description,
              year: batch.year,
              subject: batch.subject,
              college: batch.college,
              department: batch.department,
              semester: batch.semester,
              isActive: batch.isActive
            },
            assignedBy: exam.createdBy, // Using exam creator as assigner for now
            assignmentDate: exam.createdAt, // Using exam creation date for now
            isActive: true
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: assignments,
      total: assignments.length
    });
  } catch (error) {
    console.error('Get exam-batch assignments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
}
