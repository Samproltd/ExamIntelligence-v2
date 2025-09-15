import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAPI } from "../../../../../utils/auth";
import { generateCertificatePdf } from "../../../../../utils/certificate";
import Result from "../../../../../models/Result";
import User from "../../../../../models/User";
import Exam from "../../../../../models/Exam";
import dbConnect from "../../../../../utils/db";
import mongoose from "mongoose";
import * as mongooseUtils from "../../../../../utils/mongooseUtils";

// Define interfaces for type safety
interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
}

interface ICertificate {
  certificateId: string;
  issuedDate: Date;
  emailSent: boolean;
}

interface IResult {
  _id: mongoose.Types.ObjectId;
  student: IUser & mongoose.Document;
  exam: IExam & mongoose.Document;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  certificate?: ICertificate;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
    const { id } = req.query;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result ID" });
    }

    // Find the result
    const result = await mongooseUtils.findById<any, IResult>(
      Result,
      id as string,
      {
        populate: [
          {
            path: "exam",
            select: "name description duration totalMarks passPercentage",
            model: Exam,
          },
          {
            path: "student",
            select: "name email",
            model: User,
          },
        ],
      }
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    // Check permissions - only the student who took the exam or an admin can download the certificate
    if (
      req.user.role !== "admin" &&
      result.student._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Check if certificate exists
    if (!result.certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found for this result",
      });
    }

    // Additional logging for debugging
    console.log(`Generating PDF certificate for result ID: ${id}`);
    console.log(`Certificate ID: ${result.certificate.certificateId}`);

    try {
      // Generate certificate PDF
      const pdfBuffer = await generateCertificatePdf({
        studentName: result.student.name,
        examName: result.exam.name,
        examDate: new Date(result.certificate.issuedDate),
        certificateId: result.certificate.certificateId,
        score: result.score,
        percentage: result.percentage,
      });

      console.log(
        `PDF generation successful. Buffer size: ${pdfBuffer.length} bytes`
      );

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Certificate-${result.certificate.certificateId}.pdf`
      );

      // Disable streaming to ensure full buffer is sent
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Send PDF buffer as response
      res.status(200).end(pdfBuffer);
    } catch (pdfError) {
      console.error("Error in PDF generation:", pdfError);
      return res.status(500).json({
        success: false,
        message: "Error generating certificate PDF",
        error: pdfError.message,
      });
    }
  } catch (error) {
    console.error("Error downloading certificate:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing certificate request",
      error: error.message,
    });
  }
}

export default authenticateAPI(handler);
