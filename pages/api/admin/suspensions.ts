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
      // Pre-load all required models to ensure they're registered
      console.log('Loading suspensions with populated fields...');

      // Get all suspensions, populate related data, and sort by most recent first
      const suspensions = await ExamSuspension.find({})
        .populate({
          path: 'student',
          select: 'name email',
        })
        .populate({
          path: 'exam',
          select: 'name',
        })
        .populate({
          path: 'incidents',
          options: { sort: { timestamp: -1 }, limit: 5 },
        })
        .populate({
          path: 'reviewedBy',
          select: 'name email',
        })
        .sort({ suspensionTime: -1 }); // Newest suspensions first

      // Count active suspensions (not removed)
      const activeSuspensionsCount = suspensions.filter(s => !s.removed).length;

      return res.status(200).json({
        success: true,
        suspensions,
        stats: {
          totalSuspensions: suspensions.length,
          activeSuspensions: activeSuspensionsCount,
          removedSuspensions: suspensions.length - activeSuspensionsCount,
        },
      });
    } catch (error) {
      console.error('Error fetching exam suspensions:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
