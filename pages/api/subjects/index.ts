import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Subject from "../../../models/Subject";
import * as mongooseUtils from "../../../utils/mongooseUtils";
import mongoose from "mongoose";

// Define interfaces for type safety
interface ISubject {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // GET - Fetch all subjects
  if (req.method === "GET") {
    try {
      const subjects = await mongooseUtils.find<any, ISubject>(
        Subject,
        {},
        null,
        { sort: { createdAt: -1 } }
      );

      return res.status(200).json({
        success: true,
        subjects,
      });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // POST - Create a new subject (admin only)
  if (req.method === "POST") {
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

      // Check if subject already exists
      const existingSubject = await mongooseUtils.findOne<any, ISubject>(
        Subject,
        { name }
      );

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: "Subject with this name already exists",
        });
      }

      // Create the subject
      const subject = await mongooseUtils.create<any, ISubject>(Subject, {
        name,
        description,
        createdBy: req.user.userId,
      });

      return res.status(201).json({
        success: true,
        subject,
      });
    } catch (error: any) {
      console.error("Error creating subject:", error);

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
