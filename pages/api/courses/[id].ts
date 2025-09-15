import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Course from "../../../models/Course";
import Exam from "../../../models/Exam";
import Question from "../../../models/Question";
import Result from "../../../models/Result";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../utils/mongooseUtils";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid course ID" });
  }

  // GET - Fetch a single course
  if (req.method === "GET") {
    try {
      const course = await mongooseUtils.findById(Course, id as string, {
        populate: "subject",
      });

      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      return res.status(200).json({
        success: true,
        course,
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // PUT - Update a course (admin only)
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

      // Get current course to check the subject
      const currentCourse = await mongooseUtils.findById(Course, id as string);

      if (!currentCourse) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      // Check if course with same name already exists in this subject (excluding current course)
      const existingCourse = await mongooseUtils.findOne(Course, {
        name,
        subject: currentCourse.subject,
        _id: { $ne: id },
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: "Course with this name already exists in the same subject",
        });
      }

      // Update the course
      const updatedCourse = await mongooseUtils.findByIdAndUpdate(
        Course,
        id as string,
        { name, description },
        { new: true, runValidators: true, populate: "subject" }
      );

      if (!updatedCourse) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      return res.status(200).json({
        success: true,
        course: updatedCourse,
      });
    } catch (error: any) {
      console.error("Error updating course:", error);

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

  // DELETE - Delete a course and all related data (admin only)
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
        // Find the course
        const course = await mongooseUtils.findById(Course, id as string, {
          session,
        });

        if (!course) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(404)
            .json({ success: false, message: "Course not found" });
        }

        // Find all exams under this course
        const exams = await mongooseUtils.find(Exam, { course: id }, null, {
          session,
        });
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
        await mongooseUtils.deleteMany(Exam, { course: id }, { session });

        // Delete the course
        await mongooseUtils.findByIdAndDelete(Course, id as string, {
          session,
        });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: "Course and all related data deleted successfully",
        });
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

export default authenticateAPI(handler);
