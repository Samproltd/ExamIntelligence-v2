import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import { ForgotPasswordOTP } from '../../../models/ForgotPasswordOTP';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Admins cannot reset password via OTP' });
  }

  // Generate OTP and expiry
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Upsert OTP record
  await ForgotPasswordOTP.findOneAndUpdate(
    { user: user._id },
    { otp, expiry },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Read and encode logo as Base64
  let logoDataUrl = '';
  try {
    const logoPath = path.join(process.cwd(), 'public/images/logo_white_text.png');
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    logoDataUrl = `data:image/png;base64,${logoBase64}`;
  } catch (err) {
    logoDataUrl = '';
  }

  // Send OTP email (simple nodemailer example)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_EMAIL_HOST || 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL_USER,
      pass: process.env.SMTP_EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Samfocus Exam Portal" <${process.env.SMTP_EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <!-- Header with logo -->
    <div style="background-color:rgb(41, 43, 55); padding: 20px; text-align: center;">
      <img src="${logoDataUrl}" alt="Samfocus Logo" style="max-height: 80px; margin-bottom: 5px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
      <p style="color: white; margin: 10px 0 0; font-weight: bold; font-size: 16px;">"Empowering Excellence in IT Asset Management"</p>
    </div>

    <!-- Content -->
    <div style="padding: 25px; background-color: #f9f9f9;">

      <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for your Samfocus account.
        </p>

        <p style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Your OTP Code:</p>
        <div style="font-size: 28px; font-weight: bold; color: #2e6c80; text-align: center; margin: 20px 0;">
          ${otp}
        </div>

        <p style="font-size: 15px; color: #444;">
          Enter this code in the password reset page to proceed. This OTP is valid for the next <strong>5 minutes</strong>.
        </p>

        <p style="font-size: 15px; margin-top: 20px;">
          If you did not request this change, please ignore this email.
        </p>

      </div>

      <!-- Contact Info -->
      <div style="font-size: 14px; color: #666; line-height: 1.5;">
        <p>Need help or have questions? Contact our support team:</p>
        <p style="margin-top: 5px;">
          <strong>Email:</strong> <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">info@samfocus.in</a><br>
          <strong>Phone:</strong> <a href="tel:+919028224136" style="color: #2e6c80; text-decoration: none;">+91 90282 24136</a>
        </p>

        <p style="margin-top: 20px; font-size: 16px; line-height: 1.4;">Best Regards,</p>
        <p style="font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
    </div>
  `,
  });

  return res.status(200).json({ message: 'OTP sent to your email address.' });
}
