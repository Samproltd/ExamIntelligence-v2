import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import User, { IUser } from '../../../models/User';
import { generateToken, initializeDefaultAdmin, verifyToken } from '../../../utils/auth';
import * as mongooseUtils from '../../../utils/mongooseUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if default admin needs to be created
    await initializeDefaultAdmin();

    const { name, firstName, middleName, lastName, email, password, role, batch, college, mobile, dateOfBirth } = req.body;
    // console.log(req.body);

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // For students, college is required
    if (role === 'student' && !college) {
      return res.status(400).json({
        success: false,
        message: 'College selection is required for students',
      });
    }

    // Check if email is already in use
    const existingUser = await mongooseUtils.findOne(User, { email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Check if the client is trying to set a role
    let userRole = 'student'; // Default role

    // If a role was specified, check if the request has admin authorization
    if (role && role === 'admin') {
      // Get the authorization header
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        // Only admins can create new admin accounts
        if (!decoded || decoded.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Only administrators can create admin accounts',
          });
        }

        // If everything checks out, allow the specified role
        userRole = role;
      } else {
        // If no auth header or not a bearer token, deny the role change
        return res.status(401).json({
          success: false,
          message: 'Authentication required to specify roles',
        });
      }
    }

    // Prepare user data with the determined role
    const userData: any = {
      name,
      firstName,
      middleName,
      lastName,
      email,
      password,
      role: userRole,
      subscriptionStatus: 'none',
      isVerified: true, // Auto-verify for now
    };

    // Add college if provided
    if (college) {
      userData.college = college;
    }

    // Add batch if provided for students
    if (batch && userRole === 'student') {
      userData.batch = batch;
    }


    // Add mobile if provided
    if (mobile) {
      userData.mobile = mobile;
    }

    // Add date of birth if provided
    if (dateOfBirth) {
      userData.dateOfBirth = new Date(dateOfBirth);
    }

    // Create new user
    const user = await mongooseUtils.create(User, userData);
    // Cast user to IUser since we know create() returns a single document
    const createdUser = user as IUser;

    // Generate JWT token with college and subscription context
    const token = generateToken(
      createdUser._id.toString(), 
      createdUser.role, 
      createdUser.college?.toString(), 
      createdUser.subscriptionStatus
    );

    // Return user data and token
    const responseData: any = {
      success: true,
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
      token,
    };

    // Include optional fields in response if they exist
    if (createdUser.batch) {
      responseData.user.batch = createdUser.batch;
    }


    // console.log("responseData:",responseData);

    // CALL EMAIL API HERE=====================================
    // check if the role is admin or student
    // if (responseData.user.role === 'student') {
    //   try {
    //     // console.log("Initiating email send request with response data:",responseData);
    //     const response = await fetch(
    //       `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`,
    //       {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //           email,
    //           emailType: 'welcome',
    //           payload: {
    //             email: createdUser.email,
    //             name: createdUser.name,
    //             password: password,
    //           },
    //         }),
    //       }
    //     );
    //     const data = await response.json();

    //     if (!response.ok) {
    //       throw new Error(data.message || 'Failed to send email');
    //     }

    //     // res.status(201).json({ message: 'User registered and email sent!' });
    //     return res.status(201).json(responseData);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(202).json({ message: 'Registration successful, but failed to send email.' });
    //   }
    // }

    // =====================================================
    return res.status(201).json(responseData);
  } catch (error: any) {
    console.error('Registration error:', error);

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
