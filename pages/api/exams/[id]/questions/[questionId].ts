import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../../../utils/auth";
import dbConnect from "../../../../../utils/db";
import Question from "../../../../../models/Question";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../../../utils/mongooseUtils";

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  _id: mongoose.Types.ObjectId;
  text: string;
  options: QuestionOption[];
  exam: mongoose.Types.ObjectId;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id, questionId } = req.query;

  // Validate object IDs
  if (
    !mongoose.Types.ObjectId.isValid(id as string) ||
    !mongoose.Types.ObjectId.isValid(questionId as string)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid ID format" });
  }

  // GET - Fetch a single question
  if (req.method === "GET") {
    try {
      const question = await mongooseUtils.findOne<any, IQuestion>(Question, {
        _id: questionId,
        exam: id,
      });

      if (!question) {
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });
      }

      return res.status(200).json({
        success: true,
        question,
      });
    } catch (error) {
      console.error("Error fetching question:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // PUT - Update a question (admin only)
  if (req.method === "PUT") {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    try {
      const { text, options } = req.body;

      // Validate input
      if (!text || !options || !Array.isArray(options)) {
        return res.status(400).json({
          success: false,
          message: "Please provide question text and options",
        });
      }

      // Validate options (at least 2 options and exactly 1 correct answer)
      if (options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Question must have at least 2 options",
        });
      }

      const correctOptions = options.filter((option) => option.isCorrect);
      if (correctOptions.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "Question must have exactly one correct option",
        });
      }

      // Update the question using findOneAndUpdate equivalent
      const updatedQuestion = await mongooseUtils.updateOne(
        Question,
        { _id: questionId, exam: id },
        { text, options },
        { new: true, runValidators: true }
      );

      if (updatedQuestion.modifiedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });
      }

      // Get the updated question to return to client
      const question = await mongooseUtils.findOne<any, IQuestion>(Question, {
        _id: questionId,
        exam: id,
      });

      return res.status(200).json({
        success: true,
        question,
      });
    } catch (error: any) {
      console.error("Error updating question:", error);

      // Check for validation errors
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return res
          .status(400)
          .json({ success: false, message: messages.join(", ") });
      }

      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // DELETE - Delete a question (admin only)
  if (req.method === "DELETE") {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    try {
      const result = await mongooseUtils.deleteOne(Question, {
        _id: questionId,
        exam: id,
      });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Question deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

export default authenticateAPI(handler);
