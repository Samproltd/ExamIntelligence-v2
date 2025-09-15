import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { authenticateAPI, requireAdmin } from "../../../../utils/auth";
import dbConnect from "../../../../utils/db";
import User from "../../../../models/User";
import Batch from "../../../../models/Batch";
import mongoose from "mongoose";
import { validateStudentExcel } from "../../../../utils/excel";
import fs from "fs";
import { promisify } from "util";
import * as mongooseUtils from "../../../../utils/mongooseUtils";

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const readFileAsync = promisify(fs.readFile);

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
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
        errors: [
          {
            row: 0,
            errors: ["The batch ID is not valid. Please try again."],
          },
        ],
      });
    }

    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
        errors: [
          {
            row: 0,
            errors: ["The specified batch could not be found."],
          },
        ],
      });
    }

    // Parse form data
    const form = new IncomingForm({
      keepExtensions: true,
    });
    const [, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Check if file exists
    if (!files || !files.file) {
      return res.status(400).json({
        success: false,
        message:
          "No file uploaded. Please upload an Excel file with student data.",
        errors: [
          {
            row: 0,
            errors: ["No file was uploaded. Please select an Excel file."],
            cells: [{ cell: "A1", message: "No file uploaded" }],
          },
        ],
      });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    // Check file type (basic validation)
    if (
      !uploadedFile.mimetype.includes("spreadsheet") &&
      !uploadedFile.mimetype.includes("excel") &&
      !uploadedFile.originalFilename.endsWith(".xlsx")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload an Excel (.xlsx) file.",
        errors: [
          {
            row: 0,
            errors: [
              `Invalid file type: ${uploadedFile.mimetype}. Please upload an Excel (.xlsx) file.`,
            ],
            cells: [{ cell: "A1", message: "Invalid file format" }],
          },
        ],
      });
    }

    // Read file
    const fileBuffer = await readFileAsync(uploadedFile.filepath);

    // Validate student data
    const validationResult = validateStudentExcel(fileBuffer);

    // If validation failed, return errors
    if (!validationResult.valid || !validationResult.data) {
      return res.status(400).json({
        success: false,
        message: "Validation failed. Please fix the errors and try again.",
        errors: validationResult.errors,
      });
    }

    // Validate emails don't already exist in the database
    const studentEmails = validationResult.data.map((student) => student.email);
    const existingUsers = await mongooseUtils.find(User, {
      email: { $in: studentEmails },
    });
    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map((user) => user.email);

      // Find which rows have existing emails
      const emailErrors = validationResult.data
        .map((student, index) => {
          if (existingEmails.includes(student.email)) {
            return {
              row: index + 2, // +2 for header row and 0-indexing
              errors: [`Email ${student.email} already exists in the system`],
              cells: [
                {
                  cell: `B${index + 2}`,
                  message: `Email ${student.email} already exists in the system`,
                },
              ],
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{
        row: number;
        errors: string[];
        cells: Array<{ cell: string; message: string }>;
      }>;

      return res.status(400).json({
        success: false,
        message:
          "Some emails already exist in the system. Please fix the errors and try again.",
        errors: emailErrors,
      });
    }

    // At this point, data is valid and ready to be processed
    // We return the validated data for preview in the frontend
    // The actual saving will happen when the user confirms

    return res.status(200).json({
      success: true,
      message: "Excel file validated successfully.",
      students: validationResult.data,
      batchId: id,
    });
  } catch (error) {
    console.error("Error uploading students:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      errors: [
        {
          row: 0,
          errors: [
            (error as Error).message ||
              "An unexpected error occurred during file processing.",
          ],
        },
      ],
    });
  }
}

// Apply authentication middleware
export default authenticateAPI(requireAdmin(handler));
