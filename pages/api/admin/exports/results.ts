import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect, { preloadModels } from '../../../../utils/db';
import Result from '../../../../models/Result';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import User from '../../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  await dbConnect();
  await preloadModels();

  try {
    // Parse query parameters
    const { exam, batch, status, search, startDate, endDate, uniqueStudents } = req.query;

    // Build the query
    const query: any = {};

    if (exam) query['exam'] = exam;
    if (batch) query['student.batch'] = batch;
    if (status) {
      if (status === 'passed') query['passed'] = true;
      else if (status === 'failed') query['passed'] = false;
    }
    if (startDate) query['endTime'] = { $gte: new Date(startDate as string) };
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      if (query['endTime']) {
        query['endTime'].$lte = endDateTime;
      } else {
        query['endTime'] = { $lte: endDateTime };
      }
    }

    // Get the results with appropriate population
    const ResultModel = mongoose.model('Result');
    let resultsQuery = ResultModel.find(query)
      .populate({
        path: 'student',
        select: 'name email phone batch',
        populate: { path: 'batch', select: 'name year' },
      })
      .populate({
        path: 'exam',
        select: 'name description duration totalMarks passPercentage',
        populate: { path: 'course', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to prevent too large exports

    // Apply search if provided
    if (search) {
      // First, try to find students matching the search
      const studentSearchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };

      const matchingStudents = await User.find(studentSearchQuery).select('_id');
      const studentIds = matchingStudents.map((s: any) => s._id);

      // Then add exam name search
      resultsQuery = ResultModel.find({
        $and: [
          query,
          {
            $or: [
              { student: { $in: studentIds } },
              { examName: { $regex: search, $options: 'i' } },
            ],
          },
        ],
      })
        .populate({
          path: 'student',
          select: 'name email phone batch',
          populate: { path: 'batch', select: 'name year' },
        })
        .populate({
          path: 'exam',
          select: 'name description duration totalMarks passPercentage',
          populate: { path: 'course', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .limit(1000);
    }

    // Execute the query
    const results = await resultsQuery.exec();

    // Process results for Excel
    const excelRows = results.map(result => {
      const resultObj = result.toObject();
      const status = resultObj.notAttempted ? 'Not Attempted' : resultObj.passed ? 'Pass' : 'Fail';

      const date = resultObj.notAttempted
        ? '-'
        : format(new Date(resultObj.endTime), 'dd MMM yyyy HH:mm');

      const score = resultObj.notAttempted ? '-' : `${resultObj.score}/${resultObj.totalQuestions}`;

      const percentage = resultObj.notAttempted ? '-' : `${resultObj.percentage.toFixed(2)}%`;

      return {
        'Student Name': resultObj.student?.name || 'N/A',
        Email: resultObj.student?.email || 'N/A',
        Exam: resultObj.exam?.name || 'N/A',
        Course: resultObj.exam?.course?.name || 'N/A',
        Batch: resultObj.student?.batch?.name || 'N/A',
        Score: score,
        Percentage: percentage,
        Status: status,
        Date: date,
        'Attempt Number': resultObj.attemptNumber || 'N/A',
      };
    });

    // Create Excel workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Set column widths (approximate)
    const columnWidths = [
      { wch: 20 }, // Student Name
      { wch: 25 }, // Email
      { wch: 25 }, // Exam
      { wch: 20 }, // Course
      { wch: 15 }, // Batch
      { wch: 10 }, // Score
      { wch: 12 }, // Percentage
      { wch: 15 }, // Status
      { wch: 20 }, // Date
      { wch: 15 }, // Attempt Number
    ];
    worksheet['!cols'] = columnWidths;

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set headers for file download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="exam_results_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Send the buffer
    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel export:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Excel export' });
  }
}

export default authenticateAPI(handler);
