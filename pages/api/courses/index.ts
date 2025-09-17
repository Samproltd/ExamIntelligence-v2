import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Course from "../../../models/Course";
import Subject from "../../../models/Subject";
import mongoose from "mongoose";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // GET - Fetch all courses with optional subject filter
  if (req.method === "GET") {
    try {
      const { subject } = req.query;

      let query = {};

      // Filter by subject if provided
      if (subject) {
        if (!mongoose.Types.ObjectId.isValid(subject as string)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid subject ID" });
        }
        query = { subject };
      }

      // Fetch courses with pagination and populate subject and college details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courses = await (Course.find as any)(query)
        .sort({ createdAt: -1 })
        .populate("subject", "name")
        .populate("college", "name code")
        .populate("createdBy", "name email");

      return res.status(200).json({
        success: true,
        courses,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // POST - Create a new course (admin only)
  if (req.method === "POST") {
    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    try {
      const { name, description, subject } = req.body;

      // Validate input
      if (!name || !description || !subject) {
        return res.status(400).json({
          success: false,
          message: "Please provide name, description, and subject",
        });
      }

      // Validate subject ID
      if (!mongoose.Types.ObjectId.isValid(subject)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid subject ID" });
      }

      // Check if subject exists and get its college
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingSubject = await (Subject.findById as any)(subject).populate('college');

      if (!existingSubject) {
        return res
          .status(404)
          .json({ success: false, message: "Subject not found" });
      }

      // Get college from the subject
      const college = existingSubject.college._id;

      // Check if course already exists with the same name in the same subject
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingCourse = await (Course.findOne as any)({ name, subject });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message:
            "Course with this name already exists in the selected subject",
        });
      }

      // Create course with college from subject
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course = await (Course.create as any)({
        name,
        description,
        subject,
        college, // Add college from the subject
        createdBy: req.user.userId,
      });

      // Populate the subject and college fields for the response
      await course.populate("subject", "name");
      await course.populate("college", "name code");
      await course.populate("createdBy", "name email");

      return res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      console.error("Error creating course:", error);

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
