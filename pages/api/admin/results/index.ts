import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect, { preloadModels } from '../../../../utils/db';
import Result from '../../../../models/Result';
import User from '../../../../models/User';
import Batch from '../../../../models/Batch';
import mongoose from 'mongoose';
import * as mongooseUtils from '../../../../utils/mongooseUtils';
import Exam from '../../../../models/Exam';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  // Check if user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {

  try {
    const {
      exam,
      batch,
      status,
      search,
      startDate,
      endDate,
      uniqueStudents,
      limit = '50',
      page = '1',
    } = req.query;

    // Convert to numbers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build the query based on filters
    const query: any = {};

    // Filter by exam
    if (exam) {
      query.exam = new mongoose.Types.ObjectId(exam as string);
    }

    // Filter by status (passed/failed)
    if (status === 'pass') {
      query.passed = true;
    } else if (status === 'fail') {
      query.passed = false;
    } else if (status === 'not_attempted') {
      // For not attempted, we need a different approach
      // We need to find exams that don't have results for certain students
      // This will be handled differently after we gather student IDs
    }

    // Filter by date range
    if (startDate || endDate) {
      query.endTime = {};
      if (startDate) {
        query.endTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        // Set the end date to 11:59:59 PM
        endDateObj.setHours(23, 59, 59, 999);
        query.endTime.$lte = endDateObj;
      }
    }

    // Handle student batch and search filters
    let studentIds: any[] = [];
    let needStudentFilter = false;

    // Search by student name or email
    if (search) {
      const searchStudents = await mongooseUtils.find(
        User,
        {
          role: 'student',
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        },
        '_id'
      );

      if (searchStudents.length > 0) {
        studentIds = searchStudents.map(student => student._id);
        needStudentFilter = true;
      } else {
        // If no students match the search, return empty results
        return res.status(200).json({
          success: true,
          results: [],
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            pages: 0,
          },
        });
      }
    }

    // Get all students from a batch if batch filter is applied
    if (batch) {
      // First get all students in this batch
      const batchObj = await mongooseUtils.findById(Batch, batch as string);
      if (!batchObj) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      const studentsInBatch = await mongooseUtils.find(
        User,
        {
          role: 'student',
          batch: new mongoose.Types.ObjectId(batch as string),
        },
        '_id'
      );

      if (studentsInBatch.length > 0) {
        // If we already have student IDs from search, find the intersection
        if (needStudentFilter && studentIds.length > 0) {
          const batchStudentIds = studentsInBatch.map(student => student._id.toString());
          studentIds = studentIds.filter(id => batchStudentIds.includes(id.toString()));

          // If no intersection, return empty results
          if (studentIds.length === 0) {
            return res.status(200).json({
              success: true,
              results: [],
              pagination: {
                total: 0,
                page: pageNum,
                limit: limitNum,
                pages: 0,
              },
            });
          }
        } else {
          studentIds = studentsInBatch.map(student => student._id);
          needStudentFilter = true;
        }
      } else {
        // No students in this batch, return empty results
        return res.status(200).json({
          success: true,
          results: [],
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            pages: 0,
          },
        });
      }
    }

    // Apply student filter if needed
    if (needStudentFilter) {
      query.student = { $in: studentIds };
    }

    // Handle "not_attempted" status - this is a bit more complex
    if (status === 'not_attempted') {
      // We need a specific exam to determine who hasn't attempted it
      if (!exam) {
        return res.status(200).json({
          success: true,
          results: [],
          message: "To see students who haven't attempted, please select a specific exam.",
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            pages: 0,
          },
        });
      }

      // Get all students (with batch filter if provided)
      const studentQuery: any = { role: 'student' };

      if (batch) {
        studentQuery.batch = new mongoose.Types.ObjectId(batch as string);
      }

      // Filter by search term if provided
      if (search) {
        studentQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const allStudents = await mongooseUtils.find(User, studentQuery, null, {
        populate: { path: 'batch', select: 'name' },
      });

      if (allStudents.length === 0) {
        return res.status(200).json({
          success: true,
          results: [],
          message: 'No students found matching the criteria.',
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            pages: 0,
          },
        });
      }

      // Find students who have attempted the exam
      const studentsWithAttempts = await mongooseUtils.find(
        Result,
        { exam: new mongoose.Types.ObjectId(exam as string) },
        'student'
      );

      // Create a set of student IDs who have attempted
      const attemptedStudentIds = new Set(
        studentsWithAttempts.map(result => result.student.toString())
      );

      // Filter out students who have already attempted
      const studentsNotAttempted = allStudents.filter(
        student => !attemptedStudentIds.has(student._id.toString())
      );

      // Get exam details for display
      const examDetails = await mongooseUtils.findById(Exam, exam as string, {
        select: 'name',
      });

      // Create virtual "not attempted" results
      const notAttemptedResults = studentsNotAttempted.map(student => {
        return {
          _id: `na_${student._id}`, // Generate a pseudo-ID
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
          },
          exam: {
            _id: exam,
            name: examDetails?.name || 'Unknown Exam',
          },
          batch: student.batch,
          score: 0,
          totalQuestions: 0,
          percentage: 0,
          passed: false,
          notAttempted: true, // Special flag to identify not attempted records
          endTime: new Date(), // Use current date for sorting
        };
      });

      // Apply pagination to not-attempted results
      const paginatedResults = notAttemptedResults.slice(skip, skip + limitNum);

      return res.status(200).json({
        success: true,
        results: paginatedResults,
        pagination: {
          total: notAttemptedResults.length,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(notAttemptedResults.length / limitNum),
        },
      });
    }

    // Execute the query with pagination and populate references
    const results = await mongooseUtils.find(Result, query, null, {
      populate: [
        { path: 'student', select: 'name email' },
        { path: 'exam', select: 'name maxAttempts' },
      ],
      sort: { endTime: -1 },
      skip,
      limit: limitNum,
    });

    // Count total results for pagination
    const total = await mongooseUtils.countDocuments(Result, query);

    // Filter unique students if needed
    let processedResults = [];

    if (uniqueStudents === 'true') {
      // Create a map to store the latest result for each student
      const studentMap = new Map();

      // Loop through results sorted by date (most recent first)
      for (const result of results) {
        const studentId = result.student._id.toString();

        // If student not seen yet, add to map
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, result);
        }
      }

      // Convert map values back to array
      processedResults = Array.from(studentMap.values());

      // Calculate new total count for unique students (need to query DB for this)
      if (Object.keys(query).length > 0) {
        // Copy the query and add a group by student
        const uniqueQuery = { ...query };

        // Get the count of unique students in the results
        const aggregate = await Result.aggregate([
          { $match: uniqueQuery },
          { $sort: { endTime: -1 } },
          { $group: { _id: '$student', latestResult: { $first: '$$ROOT' } } },
          { $count: 'total' },
        ]);

        // Update total if aggregation returned results
        if (aggregate && aggregate.length > 0) {
          const uniqueTotal = aggregate[0].total;
          // Use the unique total for pagination
          const uniquePages = Math.ceil(uniqueTotal / limitNum);

          // Add batch info to each result
          processedResults = await Promise.all(
            processedResults.map(async result => {
              const student = await mongooseUtils.findById(User, result.student._id, {
                select: 'batch',
                populate: { path: 'batch', select: 'name' },
              });

              return {
                ...result.toObject(),
                batch: student?.batch || null,
              };
            })
          );

          // Return the unique results with updated pagination info
          return res.status(200).json({
            success: true,
            results: processedResults,
            pagination: {
              total: uniqueTotal,
              page: pageNum,
              limit: limitNum,
              pages: uniquePages,
            },
          });
        }
      }
    }

    // If not filtering unique students or the unique aggregation failed, use the standard approach
    processedResults = await Promise.all(
      results.map(async result => {
        const student = await mongooseUtils.findById(User, result.student._id, {
          select: 'batch',
          populate: { path: 'batch', select: 'name' },
        });

        return {
          ...result.toObject(),
          batch: student?.batch || null,
        };
      })
    );

    // Return the results with pagination info
    return res.status(200).json({
      success: true,
      results: processedResults,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }

  // DELETE - Bulk delete results
  if (req.method === 'DELETE') {
    try {
      const { resultIds } = req.body;

      if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Result IDs array is required' 
        });
      }

      // Validate all IDs
      const invalidIds = resultIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid result IDs provided' 
        });
      }

      const deleteResult = await mongooseUtils.deleteMany(Result, {
        _id: { $in: resultIds }
      });

      return res.status(200).json({
        success: true,
        message: `${deleteResult.deletedCount} results deleted successfully`,
        deletedCount: deleteResult.deletedCount
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default authenticateAPI(handler);
