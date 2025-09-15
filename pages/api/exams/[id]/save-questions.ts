import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI, requireAdmin } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import Exam from "../../../../models/Exam";
import Question from "../../../../models/Question";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../../utils/mongooseUtils";

// Define types for exam document
interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  course: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only POST method is allowed
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid exam ID" });
    }

    // Check if exam exists
    const exam = await mongooseUtils.findById<any, IExam>(Exam, id as string);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }

    // Get question data from request body
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid question data provided",
      });
    }

    // Process questions and prepare for database
    const processedQuestions = questions.map((question) => {
      return {
        text: question.text,
        options: [
          { text: question.option1, isCorrect: question.correctOption === 1 },
          { text: question.option2, isCorrect: question.correctOption === 2 },
          { text: question.option3, isCorrect: question.correctOption === 3 },
          { text: question.option4, isCorrect: question.correctOption === 4 },
        ],
        exam: new mongoose.Types.ObjectId(id as string),
        createdBy: req.user.userId,
      };
    });

    // Create all questions using mongooseUtils
    const createdQuestions = await mongooseUtils.create(
      Question,
      processedQuestions
    );

    return res.status(200).json({
      success: true,
      message: `Successfully added ${
        Array.isArray(createdQuestions) ? createdQuestions.length : 1
      } questions to exam "${exam.name}"`,
      count: Array.isArray(createdQuestions) ? createdQuestions.length : 1,
    });
  } catch (error) {
    console.error("Error saving questions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
}

// Apply authentication middleware
export default authenticateAPI(requireAdmin(handler));
