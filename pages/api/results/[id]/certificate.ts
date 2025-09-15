import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import Result from '../../../../models/Result';
import User from '../../../../models/User';
import Exam from '../../../../models/Exam';
import dbConnect from '../../../../utils/db';
import mongoose from 'mongoose';
import { generateCertificateId } from '../../../../utils/certificate';
import { generateCongratulationsEmail } from '../../../../utils/email';
import * as mongooseUtils from '../../../../utils/mongooseUtils';

// Define interfaces for type safety
interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface IExam {
  _id: mongoose.Types.ObjectId;
  name: string;
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
  save(): Promise<IResult>;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { id } = req.query;

    // Validate object ID
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ success: false, message: 'Invalid result ID' });
    }

    // Find the result with related exam and student data
    const result = await mongooseUtils.findById<any, IResult>(Result, id as string, {
      populate: [
        {
          path: 'exam',
          select: 'name',
          model: Exam,
        },
        {
          path: 'student',
          select: 'name email',
          model: User,
        },
      ],
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Check permissions - only the student who took the exam or an admin can access
    if (req.user.role !== 'admin' && result.student._id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // For GET requests, return existing certificate data or 404
    if (req.method === 'GET') {
      if (!result.certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found for this result',
        });
      }

      // Return certificate data
      return res.status(200).json({
        success: true,
        data: {
          studentName: result.student.name,
          examName: result.exam.name,
          issuedDate: result.certificate.issuedDate,
          certificateId: result.certificate.certificateId,
          score: result.score,
          percentage: result.percentage,
        },
      });
    }

    // For POST requests, generate a new certificate
    if (req.method === 'POST') {
      // Check if the student passed the exam
      if (!result.passed) {
        return res.status(400).json({
          success: false,
          message: 'Cannot generate certificate for failed exam',
        });
      }

      // Check if certificate already exists
      if (result.certificate) {
        return res.status(200).json({
          success: true,
          message: 'Certificate already exists',
          data: {
            certificateId: result.certificate.certificateId,
            issuedDate: result.certificate.issuedDate,
            emailSent: result.certificate.emailSent,
          },
        });
      }

      // Generate certificate data
      const certificateId = generateCertificateId();
      const issuedDate = new Date();

      // Determine if we should send an email
      const sendEmailFlag = req.body.sendEmail === true;
      let emailSent = false;

      // Send email if requested
      if (sendEmailFlag) {
        try {
          // Generate email data without attachments

          // RESPONSE NOT STORED TO FIX LINTING ERROR (CAN BE OPTIMIZED)
          generateCongratulationsEmail({
            studentName: result.student.name,
            studentEmail: result.student.email,
            examName: result.exam.name,
            score: result.score,
            percentage: result.percentage,
            certificateId: certificateId,
            examDate: issuedDate,
          });

          // Generate PDF certificate for attachment
          const { generateCertificatePdf } = await import('../../../../utils/certificate');

          // RESPONSE NOT STORED IN BUFFER TO FIX LINTING ERROR (CAN BE OPTIMIZED)
          const pdfBuffer = await generateCertificatePdf({
            studentName: result.student.name,
            examName: result.exam.name,
            examDate: issuedDate,
            certificateId: certificateId,
            score: result.score,
            percentage: result.percentage,
          });

          // Convert buffer to base64 for JSON transport
          const pdfBase64 = pdfBuffer.toString('base64');
          // Add attachment to email data
          // emailData.attachments = [
          //   {
          //     filename: `Certificate-${certificateId}.pdf`,
          //     content: pdfBuffer,
          //     contentType: "application/pdf",
          //   },
          // ];

          //   // Send the email with attachment
          //   emailSent = await sendEmail(emailData);
          // } catch (error) {
          //   console.error("Error sending certificate email:", error);
          //   // Continue with certificate generation even if email fails
          // }

          // send certificate email

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: result.student.email,
                emailType: 'certificate',
                payload: {
                  studentName: result.student.name,
                  examName: result.exam.name,
                  examDate: issuedDate,
                  certificateId: certificateId,
                  score: result.score,
                  percentage: result.percentage,
                  fileName: `${certificateId}.pdf`,
                  pdf_file: pdfBase64,
                },
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to send certificate email.');
          }

          console.log('✅ Certificate email sent:', data.message);
          emailSent = true;
        } catch (error) {
          console.error('❌ Error sending certificate email:', error);
        }
      }

      // Update the result with certificate data
      const certificate = {
        certificateId,
        issuedDate,
        emailSent,
      };

      result.certificate = certificate;
      await result.save();

      return res.status(200).json({
        success: true,
        message: 'Certificate generated successfully',
        data: {
          certificateId,
          issuedDate,
          emailSent,
        },
      });
    }
  } catch (error) {
    console.error('Error handling certificate request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export default authenticateAPI(handler);
