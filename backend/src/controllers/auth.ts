import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Added bcryptjs
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth'; // Removed users, InMemoryUser
import User, { IUser } from '../models/User'; // Added User model and IUser interface


const generateToken = (userId: string, role: 'citizen' | 'police' | 'admin'): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(
    { userId, role } as jwt.JwtPayload,
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
  );
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role: 'citizen', // Default role, can be adjusted
      isVerified: false // Default verification status
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id.toString(), newUser.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.name.split(' ')[0] || '',
      lastName: newUser.name.split(' ').slice(1).join(' ') || '',
      role: newUser.role,
      isVerified: newUser.isVerified,
      // Assuming User model has timestamps: true
      createdAt: newUser.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: newUser.updatedAt?.toISOString() || new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id; // This comes from the JWT token after protect middleware
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString()
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    logger.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user data'
    });
  }
};
