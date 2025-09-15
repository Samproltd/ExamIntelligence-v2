import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Result from "../../../models/Result";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../utils/mongooseUtils";

// Define interfaces for type safety
interface IResult {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  exam: {
    _id: mongoose.Types.ObjectId;
    name: string;
    course: {
      _id: mongoose.Types.ObjectId;
      name: string;
      subject: {
        _id: mongoose.Types.ObjectId;
        name: string;
      };
    };
  };
  score: number;
  percentage: number;
  createdAt: Date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only GET method is allowed
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Students can only see their own results
    const query =
      req.user.role === "student" ? { student: req.user.userId } : {};

    const results = await mongooseUtils.find<any, IResult>(
      Result,
      query,
      null,
      {
        sort: { createdAt: -1 },
        populate: {
          path: "exam",
          select: "name course",
          populate: {
            path: "course",
            select: "name subject",
            populate: {
              path: "subject",
              select: "name",
            },
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export default authenticateAPI(handler);
