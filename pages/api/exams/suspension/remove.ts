import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import ExamSuspension from "../../../../models/ExamSuspension";
import mongoose from "mongoose";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only admins can remove suspension
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can remove exam suspensions",
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { examId, studentId } = req.body;

    // Validate required parameters
    if (!examId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Both examId and studentId are required",
      });
    }

    // Validate object IDs
    if (
      !mongoose.Types.ObjectId.isValid(examId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID or student ID",
      });
    }

    // Find the suspension
    const suspension = await ExamSuspension.findOne({
      exam: examId,
      student: studentId,
      removed: { $ne: true }, // Only find active suspensions that haven't been removed
    }).sort({ suspensionTime: -1 }); // Get the most recent active suspension

    if (!suspension) {
      return res.status(404).json({
        success: false,
        message: "No active suspension found for this student and exam",
      });
    }

    // Update the suspension directly using update method
    await ExamSuspension.updateOne(
      { _id: suspension._id },
      {
        $set: {
          reviewedByAdmin: true,
          reviewedAt: new Date(),
          reviewedBy: req.user.userId,
          removed: true,
          removedAt: new Date(),
        },
      }
    );

    // Fetch the updated suspension to return in the response
    const updatedSuspension = await ExamSuspension.findOne({
      _id: suspension._id,
    });

    // Get the count of all suspensions for this student and exam
    const allSuspensionsCount = await ExamSuspension.countDocuments({
      exam: examId,
      student: studentId,
    });

    // Get the count of active suspensions after this update
    const activeSuspensionsCount = await ExamSuspension.countDocuments({
      exam: examId,
      student: studentId,
      removed: { $ne: true },
    });

    return res.status(200).json({
      success: true,
      message: "Exam suspension has been removed successfully",
      suspension: updatedSuspension,
      stats: {
        totalSuspensions: allSuspensionsCount,
        activeSuspensions: activeSuspensionsCount,
        removedSuspensions: allSuspensionsCount - activeSuspensionsCount,
      },
    });
  } catch (error) {
    console.error("Error removing exam suspension:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing suspension",
    });
  }
}

export default authenticateAPI(handler);
