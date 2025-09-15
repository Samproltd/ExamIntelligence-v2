import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Result from "../../../models/Result";
// Import all required models to ensure they are registered
import "../../../models/Question";
import "../../../models/Exam";
import "../../../models/Course";
import "../../../models/Subject";
import "../../../models/User";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../utils/mongooseUtils";

// Define interfaces for type safety
interface IResult {
  _id: mongoose.Types.ObjectId;
  student: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  exam: {
    _id: mongoose.Types.ObjectId;
    name: string;
    totalMarks: number;
    passPercentage: number;
    duration: number;
    course: any;
  };
  answers: {
    question: {
      _id: mongoose.Types.ObjectId;
      text: string;
      options: {
        text: string;
        isCorrect: boolean;
      }[];
    };
    selectedOption: string;
    isCorrect: boolean;
  }[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  createdAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  console.log(`Fetching result with ID: ${id}`);

  // Validate the ID format before attempting to query
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    console.error(`Invalid result ID format: ${id}`);
    return res
      .status(400)
      .json({ success: false, message: "Invalid result ID format" });
  }

  // GET - Fetch a single result
  if (req.method === "GET") {
    try {
      console.log(`Looking up result with MongoDB ID: ${id}`);

      // Try to find the result directly, rather than checking if it exists first
      const result = await mongooseUtils.findById<any, IResult>(
        Result,
        id as string,
        {
          populate: [
            { path: "student", select: "name email" },
            {
              path: "exam",
              select: "name totalMarks passPercentage duration course",
              populate: {
                path: "course",
                select: "name subject",
                populate: {
                  path: "subject",
                  select: "name",
                },
              },
            },
            {
              path: "answers.question",
              select: "text options",
            },
          ],
        }
      );

      // If no result is found, return 404
      if (!result) {
        console.error(`Result not found with ID: ${id}`);

        // Log all available results for debugging
        const allResults = await mongooseUtils.find(
          Result,
          {},
          "_id exam student createdAt",
          { limit: 20 }
        );

        console.log(
          "Available recent results:",
          allResults.map((r) => ({
            id: r._id.toString(),
            date: r.createdAt,
            exam: r.exam,
            student: r.student,
          }))
        );

        return res.status(404).json({
          success: false,
          message: "Result not found",
          debug: {
            requestedId: id,
            exists: false,
            sampleIds: allResults.map((r) => r._id.toString()),
          },
        });
      }

      console.log(
        `Found result for exam: ${result.exam?.name}, student: ${result.student?.name}`
      );

      // Check if the user is authorized to view this result
      // Students can only see their own results
      if (
        req.user.role === "student" &&
        result.student._id.toString() !== req.user.userId
      ) {
        console.error(
          `Unauthorized access attempt. User ${req.user.userId} tried to access result for student ${result.student._id}`
        );
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      return res.status(200).json({ success: true, result });
    } catch (error) {
      console.error("Error fetching result:", error);

      // Enhanced error response
      return res.status(500).json({
        success: false,
        message: "Server error while retrieving result",
        error: {
          message: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        debug: {
          resultId: id,
        },
      });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

export default authenticateAPI(handler);
