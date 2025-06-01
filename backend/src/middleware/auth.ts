import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import User, { IUser } from '../models/User'; // Import User model and IUser interface

// Removed in-memory user storage and InMemoryUser type

export interface AuthRequest extends Request {
  user?: IUser | null; // Updated to use IUser
}

interface CustomJwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null; // Updated to use IUser
    }
  }
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;
      // Fetch user from MongoDB
      const user = await User.findById(decoded.userId).select('-password'); // Exclude password
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found or token invalid', // More generic message
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('JWT verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const authorize = (...roles: ('citizen' | 'police' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // req.user.role will be of type 'citizen' | 'police' | 'admin' from IUser
    if (!roles.includes(req.user.role as 'citizen' | 'police' | 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action',
      });
    }

    next();
  };
};
