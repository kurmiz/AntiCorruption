import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthRequest, users, InMemoryUser } from '../middleware/auth';


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
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser: InMemoryUser = {
      _id: String(users.length + 1),
      email,
      password,
      name,
      role: 'citizen',
      isVerified: false
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.name.split(' ')[0] || '',
      lastName: newUser.name.split(' ').slice(1).join(' ') || '',
      role: newUser.role,
      isVerified: newUser.isVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    const userId = req.user?._id;
    const user = users.find(u => u._id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
