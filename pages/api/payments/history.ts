import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Payment from '../../../models/Payment';
import * as mongooseUtils from '../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can view their payment history
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their payment history',
      });
    }

    // Find all payments for this student
    const payments = await mongooseUtils.find(Payment, { student: req.user.userId }, null, {
      populate: {
        path: 'exam',
        select: 'name',
      },
      sort: { createdAt: -1 },
      lean: true,
    });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
