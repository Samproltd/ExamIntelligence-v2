import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import User from '../models/User';
import * as mongooseUtils from '../utils/mongooseUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface DecodedToken {
  userId: string;
  role: string;
  college?: string;
  subscriptionStatus?: string;
  iat: number;
  exp: number;
}

// Define interfaces for type safety
interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

// Extend NextApiRequest to include user property
declare module 'next' {
  interface NextApiRequest {
    user?: DecodedToken;
  }
}

// Generate JWT token
export const generateToken = (userId: string, role: string, college?: string, subscriptionStatus?: string): string => {
  const payload = { userId, role, college, subscriptionStatus };
  // Use any to get around TypeScript's strict typing for jwt options
  const options: any = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Middleware to authenticate API routes
export const authenticateAPI =
  (handler: any) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Check for token in Authorization header
      const authHeader = req.headers.authorization;
      let token;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // If no Authorization header, check query parameters
        token = req.query.token as string;
      }

      // If no token found anywhere, return authentication required
      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      // Add user info to the request object
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
  };

// Middleware to check for admin role
export const requireAdmin = (handler: any) => async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    if (!['admin', 'college_admin', 'college_staff'].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Add user info to the request object
    req.user = decoded;

    return handler(req, res);
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Compare plain text password with hashed password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcryptjs.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
};

// Check if user exists and create default admin if not
export const initializeDefaultAdmin = async () => {
  try {
    const adminCount = await mongooseUtils.countDocuments(User, {
      role: 'admin',
    });

    if (adminCount === 0) {
      await mongooseUtils.create<any, IUser>(User, {
        name: process.env.ADMIN_NAME || 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123', // This will be hashed in the model's pre-save hook
        role: 'super_admin',
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};
