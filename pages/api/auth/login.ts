import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';
import { generateToken } from '../../../utils/auth';
import * as mongooseUtils from '../../../utils/mongooseUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user by email and include password for comparison
    const user = await mongooseUtils.findOne(
      User,
      { email: email.toLowerCase().trim() },
      '+password'
    );

    // Check if user exists
    if (!user) {
      console.log(`Login attempt failed: No user found with email ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Log user info for debugging
    console.log(`Login attempt for user: ${user.email}, ID: ${user._id}, Name: ${user.name}`);

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`Login attempt failed: Password mismatch for user ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if the login state is blocked or unblocked
    if (user.isBlocked) {
      console.log(`Login attempt failed: User ${email} is blocked`);
      return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);

    // Return user data and token
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
