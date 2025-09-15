import { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Result from "../../../models/Result";
import Exam from "../../../models/Exam";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../utils/mongooseUtils";

// Define interfaces for type safety
interface ICertificate {
  certificateId: string;
  issuedDate: Date;
}

interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface IResult {
  _id: mongoose.Types.ObjectId;
  exam: IExam;
  student: mongoose.Types.ObjectId;
  score: number;
  percentage: number;
  certificate?: ICertificate;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // Get certificates for the current user
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Find all results with certificates for this student
      const results = await mongooseUtils.find<any, IResult>(
        Result,
        {
          student: studentId,
          certificate: { $exists: true },
        },
        null,
        {
          populate: {
            path: "exam",
            model: Exam,
            select: "name",
          },
          sort: { "certificate.issuedDate": -1 },
        }
      );

      // Transform the results for better readability
      const certificates = results.map((result) => ({
        _id: result._id,
        examName: result.exam?.name || "Unknown Exam",
        certificateId: result.certificate?.certificateId,
        issuedDate: result.certificate?.issuedDate,
        score: result.score,
        percentage: result.percentage,
      }));

      return res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      console.error("Error fetching certificates:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve certificates",
        error: error.message,
      });
    }
  } else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

export default authenticateAPI(handler);
