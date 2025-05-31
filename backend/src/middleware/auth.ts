import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Temporary in-memory user storage
export const users: InMemoryUser[] = [
  {
    _id: '1',
    email: 'admin@anticorruption.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    isVerified: true
  },
  {
    _id: '2',
    email: 'police@anticorruption.com',
    password: 'police123',
    name: 'Police Officer',
    role: 'police',
    isVerified: true
  },
  {
    _id: '3',
    email: 'user@anticorruption.com',
    password: 'user123',
    name: 'John Citizen',
    role: 'citizen',
    isVerified: true
  }
];

export type InMemoryUser = {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
};

export interface AuthRequest extends Request {
  user?: InMemoryUser;
}

interface CustomJwtPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: InMemoryUser;
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
      const user = users.find(u => u._id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action',
      });
    }

    next();
  };
};
