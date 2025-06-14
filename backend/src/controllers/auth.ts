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
    const { email, password, firstName, lastName, name, role = 'citizen' } = req.body;

    // Handle both old (name) and new (firstName, lastName) formats
    let userFirstName = firstName;
    let userLastName = lastName;

    if (!firstName && !lastName && name) {
      // Split name if only name is provided (backward compatibility)
      const nameParts = name.split(' ');
      userFirstName = nameParts[0] || '';
      userLastName = nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!userFirstName || !userLastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const newUser = new User({
      email,
      password,
      firstName: userFirstName,
      lastName: userLastName,
      role,
      isVerified: false,
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: false,
        profileVisibility: 'public',
        defaultDashboard: 'overview'
      }
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id.toString(), newUser.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      isVerified: newUser.isVerified,
      preferences: newUser.preferences,
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
      message: error instanceof Error ? error.message : 'Error creating user'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Add security log
    await user.addSecurityLog(
      'login',
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      true
    );

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      preferences: user.preferences,
      lastLogin: user.lastLogin?.toISOString(),
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
    // The user is already attached to req by the protect middleware
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found in request'
      });
    }

    // Transform user data to match frontend expectations
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      preferences: user.preferences,
      lastLogin: user.lastLogin?.toISOString(),
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

// Profile update endpoint
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Profile update request received', {
      userId: req.user?._id,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None',
        contentType: req.headers['content-type']
      }
    });

    const user = req.user;
    if (!user) {
      logger.error('Profile update failed: User not found in request');
      return res.status(400).json({
        success: false,
        message: 'User not found in request'
      });
    }

    const { firstName, lastName, phone, avatar } = req.body;
    logger.info('Profile update data', { firstName, lastName, phone, hasAvatar: !!avatar });

    // Get the full user document for updating
    const fullUser = await User.findById(user._id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (firstName !== undefined) fullUser.firstName = firstName;
    if (lastName !== undefined) fullUser.lastName = lastName;
    if (phone !== undefined) fullUser.phone = phone;
    if (avatar !== undefined) fullUser.avatar = avatar;

    await fullUser.save();
    logger.info('Profile updated successfully in database', {
      userId: fullUser._id,
      updatedFields: { firstName: fullUser.firstName, lastName: fullUser.lastName, phone: fullUser.phone }
    });

    // Add security log
    await fullUser.addSecurityLog(
      'profile_update',
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      true,
      'Profile information updated'
    );

    // Transform user data to match frontend expectations
    const userResponse = {
      id: fullUser._id.toString(),
      email: fullUser.email,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      phone: fullUser.phone,
      avatar: fullUser.avatar,
      role: fullUser.role,
      isVerified: fullUser.isVerified,
      preferences: fullUser.preferences,
      lastLogin: fullUser.lastLogin?.toISOString(),
      createdAt: fullUser.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: fullUser.updatedAt?.toISOString() || new Date().toISOString()
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating profile'
    });
  }
};

// Update preferences endpoint
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found in request'
      });
    }

    // Get the full user document for updating
    const fullUser = await User.findById(user._id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    fullUser.preferences = { ...fullUser.preferences, ...req.body };
    await fullUser.save();

    res.json({
      success: true,
      data: {
        preferences: fullUser.preferences,
        user: {
          id: fullUser._id.toString(),
          email: fullUser.email,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          phone: fullUser.phone,
          avatar: fullUser.avatar,
          role: fullUser.role,
          isVerified: fullUser.isVerified,
          preferences: fullUser.preferences,
          lastLogin: fullUser.lastLogin?.toISOString(),
          createdAt: fullUser.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: fullUser.updatedAt?.toISOString() || new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating preferences'
    });
  }
};

// Password update endpoint
export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Password update request received', {
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    const user = req.user;
    if (!user) {
      logger.error('Password update failed: User not found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      logger.warn('Password update failed: Missing required fields', { userId: user._id });
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required'
      });
    }

    // Validate new password confirmation
    if (newPassword !== confirmPassword) {
      logger.warn('Password update failed: Password confirmation mismatch', { userId: user._id });
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    // Get the full user document with password
    const fullUser = await User.findById(user._id).select('+password');
    if (!fullUser) {
      logger.error('Password update failed: User not found in database', { userId: user._id });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await fullUser.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      logger.warn('Password update failed: Invalid current password', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Add security log for failed password change attempt
      await fullUser.addSecurityLog(
        'password_change_failed',
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false,
        'Invalid current password provided'
      );

      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await fullUser.comparePassword(newPassword);
    if (isSamePassword) {
      logger.warn('Password update failed: New password same as current', { userId: user._id });
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    fullUser.password = newPassword;

    // Save the user (this triggers password hashing middleware)
    await fullUser.save();

    logger.info('Password updated successfully', {
      userId: fullUser._id,
      email: fullUser.email,
      timestamp: new Date().toISOString()
    });

    // Add security log for successful password change
    await fullUser.addSecurityLog(
      'password_change',
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      true,
      'Password changed successfully'
    );

    // Verify the password was actually updated in the database
    const updatedUser = await User.findById(user._id).select('+password');
    const isNewPasswordSet = await updatedUser?.comparePassword(newPassword);

    if (!isNewPasswordSet) {
      logger.error('Password update verification failed: New password not set correctly', { userId: user._id });
      return res.status(500).json({
        success: false,
        message: 'Password update failed - please try again'
      });
    }

    logger.info('Password update verified in database', { userId: user._id });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Password update error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?._id
    });

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating password'
    });
  }
};
