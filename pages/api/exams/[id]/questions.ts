import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import Question from "../../../../models/Question";
import Exam from "../../../../models/Exam";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../../utils/mongooseUtils";

// Define interfaces for type safety
interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
}

interface IQuestion {
  _id: mongoose.Types.ObjectId;
  text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  exam: mongoose.Types.ObjectId;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: "Invalid exam ID" });
  }

  // GET - Fetch all questions for an exam
  if (req.method === "GET") {
    try {
      // Check if exam exists
      const exam = await mongooseUtils.findById<any, IExam>(Exam, id as string);

      if (!exam) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      const questions = await mongooseUtils.find<any, IQuestion>(
        Question,
        { exam: id },
        null,
        { sort: { createdAt: 1 } }
      );

      return res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // POST - Create a new question (admin only)
  if (req.method === "POST") {
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

      // Check if exam exists
      const exam = await mongooseUtils.findById<any, IExam>(Exam, id as string);

      if (!exam) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
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

      // Create the question
      const question = await mongooseUtils.create<any, IQuestion>(Question, {
        text,
        options,
        exam: id,
        createdBy: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        question,
      });
    } catch (error: any) {
      console.error("Error creating question:", error);

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

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

export default authenticateAPI(handler);
