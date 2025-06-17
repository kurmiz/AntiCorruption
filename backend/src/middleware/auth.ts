import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import User, { IUser } from '../models/User'; // Import User model and IUser interface

// Removed in-memory user storage and InMemoryUser type

export interface AuthRequest extends Request {
  user?: IUser | null;
  userId?: string;
  userRole?: string;
}

export interface JWTPayload {
  user_id: string;
  userId: string; // Keep both for compatibility
  role: 'citizen' | 'admin' | 'police';
  exp: number;
  iat: number;
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Support both user_id and userId for compatibility
      const userId = decoded.user_id || decoded.userId;

      // Fetch user from MongoDB
      const user = await User.findById(userId).select('-password');

      if (!user) {
        logger.warn('User not found for token:', { userId });
        return res.status(401).json({
          success: false,
          message: 'User not found or token invalid',
        });
      }

      // Attach user data to request
      req.user = user;
      req.userId = user._id.toString();
      req.userRole = user.role;

      logger.debug('User authenticated:', {
        userId: req.userId,
        role: req.userRole
      });

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
