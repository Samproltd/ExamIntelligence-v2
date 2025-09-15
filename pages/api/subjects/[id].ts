import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Subject from "../../../models/Subject";
import Course from "../../../models/Course";
import Exam from "../../../models/Exam";
import Question from "../../../models/Question";
import Result from "../../../models/Result";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../utils/mongooseUtils";

// Define interfaces for type safety
interface ISubject {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  subject: mongoose.Types.ObjectId;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid subject ID" });
  }

  // GET - Fetch a single subject
  if (req.method === "GET") {
    try {
      const subject = await mongooseUtils.findById<any, ISubject>(
        Subject,
        id as string
      );

      if (!subject) {
        return res
          .status(404)
          .json({ success: false, message: "Subject not found" });
      }

      return res.status(200).json({
        success: true,
        subject,
      });
    } catch (error) {
      console.error("Error fetching subject:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // PUT - Update a subject (admin only)
  if (req.method === "PUT") {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    try {
      const { name, description } = req.body;

      // Validate input
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: "Please provide name and description",
        });
      }

      // Check if new name already exists for a different subject
      const existingSubject = await mongooseUtils.findOne(Subject, {
        name,
        _id: { $ne: id },
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: "Subject with this name already exists",
        });
      }

      // Update the subject
      const updatedSubject = await mongooseUtils.findByIdAndUpdate<
        any,
        ISubject
      >(
        Subject,
        id as string,
        { name, description },
        { new: true, runValidators: true }
      );

      if (!updatedSubject) {
        return res
          .status(404)
          .json({ success: false, message: "Subject not found" });
      }

      return res.status(200).json({
        success: true,
        subject: updatedSubject,
      });
    } catch (error: any) {
      console.error("Error updating subject:", error);

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

  // DELETE - Delete a subject and all related data (admin only)
  if (req.method === "DELETE") {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find the subject
        const subject = await mongooseUtils.findById(Subject, id as string, {
          session,
        });

        if (!subject) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ success: false, message: "Subject not found" });
        }

        // Find all courses under this subject
        const courses = await mongooseUtils.find<any, ICourse>(
          Course,
          { subject: id },
          null,
          { session }
        );
        const courseIds = courses.map((course) => course._id);

        // Find all exams under these courses
        const exams = await mongooseUtils.find(
          Exam,
          { course: { $in: courseIds } },
          null,
          { session }
        );
        const examIds = exams.map((exam) => exam._id);

        // Delete all results for these exams
        await mongooseUtils.deleteMany(
          Result,
          { exam: { $in: examIds } },
          { session }
        );

        // Delete all questions for these exams
        await mongooseUtils.deleteMany(
          Question,
          { exam: { $in: examIds } },
          { session }
        );

        // Delete all exams
        await mongooseUtils.deleteMany(
          Exam,
          { course: { $in: courseIds } },
          { session }
        );

        // Delete all courses
        await mongooseUtils.deleteMany(Course, { subject: id }, { session });

        // Delete the subject
        await mongooseUtils.findByIdAndDelete(Subject, id as string, {
          session,
        });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: "Subject and all related data deleted successfully",
        });
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

export default authenticateAPI(handler);
