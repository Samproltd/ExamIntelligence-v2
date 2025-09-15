import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Subject from '../../../models/Subject';
import Course from '../../../models/Course';
import Exam from '../../../models/Exam';
import User from '../../../models/User';
import Result from '../../../models/Result';
import * as mongooseUtils from '../../../utils/mongooseUtils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  // GET - Fetch dashboard statistics
  if (req.method === 'GET') {
    try {
      // Count statistics
      const subjects = await Subject.countDocuments();
      const courses = await Course.countDocuments();
      const exams = await Exam.countDocuments();
      const students = await User.countDocuments({ role: 'student' });

      // Get all exams for dropdown filter
      const allExams = await mongooseUtils.find(Exam, {}, null, {
        select: '_id name',
        sort: { name: 1 },
      });

      // Get exam pass rate distribution data
      const passRateRanges = [
        { min: 0, max: 50, label: '0-50%' },
        { min: 51, max: 70, label: '51-70%' },
        { min: 71, max: 90, label: '71-90%' },
        { min: 91, max: 100, label: '91-100%' },
      ];

      // Get overall pass rate distribution (no exam filter)
      const overallDistribution = await Promise.all(
        passRateRanges.map(async range => {
          const count = await Result.countDocuments({
            percentage: { $gte: range.min, $lte: range.max },
          });
          return { range: range.label, count };
        })
      );

      // Get per-exam pass rate distribution
      const examDistribution = await Promise.all(
        allExams.map(async exam => {
          const examRangeData = await Promise.all(
            passRateRanges.map(async range => {
              const count = await Result.countDocuments({
                exam: exam._id,
                percentage: { $gte: range.min, $lte: range.max },
              });
              return {
                examId: exam._id,
                examName: exam.name,
                range: range.label,
                count,
              };
            })
          );
          return examRangeData;
        })
      );

      // Flatten the exam distribution data
      const flattenedExamDistribution = examDistribution.flat();

      // Get recent exam results
      const recentExams = await Result.aggregate([
        {
          $group: {
            _id: '$exam',
            totalStudents: { $sum: 1 },
            totalScore: { $sum: '$percentage' },
            passed: { $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } },
          },
        },
        {
          $project: {
            totalStudents: 1,
            averageScore: { $divide: ['$totalScore', '$totalStudents'] },
            passRate: {
              $multiply: [{ $divide: ['$passed', '$totalStudents'] }, 100],
            },
          },
        },
        { $sort: { totalStudents: -1 } },
        { $limit: 5 },
      ]);

      // Get exam names
      const examIds = recentExams.map(exam => exam._id);
      const examDetails = await mongooseUtils.find(Exam, { _id: { $in: examIds } }, null, {
        select: 'name course',
        populate: {
          path: 'course',
          select: 'name',
        },
      });

      // Define the exam detail structure
      interface ExamDetailDocument {
        _id: any;
        name: string;
        course: {
          _id: any;
          name: string;
        };
      }

      // Type the examDetails array
      const typedExamDetails = examDetails as unknown as ExamDetailDocument[];

      // Create a map with proper typing
      const examDetailsMap = new Map<string, ExamDetailDocument>();
      typedExamDetails.forEach(exam => {
        examDetailsMap.set(exam._id.toString(), exam);
      });

      // Combine exam details with statistics
      const formattedRecentExams = recentExams.map(exam => {
        const details = examDetailsMap.get(exam._id.toString());
        return {
          _id: exam._id,
          name: details ? details.name : 'Unknown Exam',
          course:
            details && details.course
              ? {
                  _id: details.course._id,
                  name: details.course.name,
                }
              : { _id: '', name: 'Unknown Course' },
          totalStudents: exam.totalStudents,
          averageScore: exam.averageScore,
          passRate: exam.passRate,
        };
      });

      // Get results over time (monthly)
      const currentYear = new Date().getFullYear();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const resultsOverTimePromises = monthNames.map(async (month, index) => {
        // Calculate the month's start and end dates
        const startDate = new Date(currentYear, index, 1);
        const endDate = new Date(currentYear, index + 1, 0);

        // Count passes and fails for this month
        const passes = await Result.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          passed: true,
        });

        const fails = await Result.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
          passed: false,
        });

        return {
          month,
          passes,
          fails,
        };
      });

      const resultsOverTime = await Promise.all(resultsOverTimePromises);

      // Get student statistics
      const activeStudents = await User.countDocuments({ role: 'student' });
      const inactiveStudents = 0; // We don't track inactive students directly

      // Get new students this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newThisMonth = await User.countDocuments({
        role: 'student',
        createdAt: { $gte: startOfMonth },
      });

      // Get batch distribution
      const batchDistribution = await User.aggregate([
        { $match: { role: 'student' } },
        {
          $lookup: {
            from: 'batches',
            localField: 'batch',
            foreignField: '_id',
            as: 'batchDetails',
          },
        },
        {
          $group: {
            _id: '$batch',
            count: { $sum: 1 },
            batchName: { $first: { $arrayElemAt: ['$batchDetails.name', 0] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const formattedBatchDistribution = batchDistribution.map(batch => ({
        batchName: batch.batchName || 'No Batch',
        count: batch.count,
      }));

      return res.status(200).json({
        success: true,
        subjects,
        courses,
        exams,
        students,
        examsList: allExams,
        recentExams: formattedRecentExams,
        examStats: {
          passRateDistribution: [...overallDistribution, ...flattenedExamDistribution],
          resultsOverTime,
          completed: await Result.countDocuments(),
          upcoming: exams, // Since we don't track exam start dates, use total exams as a fallback
        },
        studentStats: {
          totalActive: activeStudents,
          totalInactive: inactiveStudents,
          newThisMonth,
          batchDistribution: formattedBatchDistribution || [],
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
