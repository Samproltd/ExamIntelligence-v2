import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../utils/db";
import { requireAdmin } from "../../../utils/auth";
import SecurityIncident from "../../../models/SecurityIncident";
import mongoose from "mongoose";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only allow GET method for fetching incidents
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // Get student ID from the URL
  const { studentId } = req.query;

  // Validate student ID format
  if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid student ID format" });
  }

  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Optional exam filter
    const examFilter = req.query.examId ? { exam: req.query.examId } : {};

    // Build the full query
    const query = {
      student: studentId,
      ...examFilter,
    };

    // Fetch incidents with pagination
    const incidents = await SecurityIncident.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "exam",
        select: "name duration course",
        populate: {
          path: "course",
          select: "name subject",
          populate: {
            path: "subject",
            select: "name",
          },
        },
      });

    // Get total count for pagination
    const total = await SecurityIncident.countDocuments(query);

    return res.status(200).json({
      success: true,
      incidents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching security incidents:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export default requireAdmin(handler);
