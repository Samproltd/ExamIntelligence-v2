import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import { ForgotPasswordOTP } from '../../../models/ForgotPasswordOTP';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.role === 'admin')
    return res.status(403).json({ message: 'Admins cannot reset password via OTP.' });

  const otpRecord = await ForgotPasswordOTP.findOne({ user: user._id });
  if (!otpRecord)
    return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });

  if (otpRecord.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
  if (otpRecord.expiry < new Date())
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

  // Update password
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: user._id }, { password: hashed });

  // Remove OTP record
  await ForgotPasswordOTP.deleteOne({ user: user._id });

  return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
}
