import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual field combining firstName and lastName
  phone?: string;
  avatar?: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;

  // Security Features
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;

  // User Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    profileVisibility: 'public' | 'private' | 'contacts';
    defaultDashboard: string;
  };

  // Security Logging
  securityLog: Array<{
    action: string;
    ip: string;
    userAgent: string;
    timestamp: Date;
    success: boolean;
    details?: string;
  }>;

  // Active Sessions
  activeSessions: Array<{
    sessionId: string;
    device: string;
    ip: string;
    location?: string;
    userAgent: string;
    lastActive: Date;
    createdAt: Date;
  }>;

  createdAt?: Date;
  updatedAt?: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  addSecurityLog(action: string, ip: string, userAgent: string, success: boolean, details?: string): Promise<void>;
  addSession(sessionId: string, device: string, ip: string, userAgent: string, location?: string): Promise<void>;
  removeSession(sessionId: string): Promise<void>;
  clearOtherSessions(currentSessionId: string): Promise<void>;
}

// This interface was present before, keeping it for potential specific input validation scenarios
// though for basic creation, IUser properties will be used.
export interface IUserInput {
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    index: true, // Index for faster queries
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password: string) {
        // Only validate if password is being modified and not already hashed
        if (this.isModified('password') && !password.startsWith('$2')) {
          // Password must contain at least one uppercase, one lowercase, and one number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
        }
        return true; // Skip validation for already hashed passwords
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // Optional field
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  avatar: {
    type: String,
    validate: {
      validator: function(avatar: string) {
        if (!avatar) return true; // Optional field
        return avatar.startsWith('data:image/') || avatar.startsWith('http');
      },
      message: 'Avatar must be a valid image URL or base64 data'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['citizen', 'police', 'admin'],
      message: 'Role must be either citizen, police, or admin'
    },
    default: 'citizen',
    index: true, // Index for role-based queries
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true, // Index for verification status queries
  },
  verificationToken: {
    type: String,
    index: { sparse: true }, // Sparse index for optional field
  },
  resetPasswordToken: {
    type: String,
    index: { sparse: true }, // Sparse index for optional field
  },
  resetPasswordExpires: {
    type: Date,
    index: { sparse: true }, // Sparse index for optional field
  },
  lastLogin: {
    type: Date,
    index: true, // Index for login tracking
  },

  // Security Features
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false, // Don't include in queries by default
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  lockUntil: {
    type: Date,
    index: { sparse: true },
  },

  // User Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
      match: [/^[a-z]{2}$/, 'Language must be a valid 2-letter code']
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: false,
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'contacts'],
      default: 'public',
    },
    defaultDashboard: {
      type: String,
      default: 'overview',
    },
  },

  // Security Logging
  securityLog: [{
    action: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'password_change', 'email_change', '2fa_enable', '2fa_disable', 'failed_login', 'account_locked']
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    details: {
      type: String,
    }
  }],

  // Active Sessions
  activeSessions: [{
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    userAgent: {
      type: String,
      required: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  collection: 'users', // Explicit collection name
  versionKey: false, // Disable __v field
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      // Remove sensitive fields from object output
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      return ret;
    }
  }
});

// Virtual field for full name
userSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'securityLog.timestamp': -1 });
userSchema.index({ 'activeSessions.lastActive': -1 });

// Compound indexes
userSchema.index({ email: 1, isVerified: 1 });
userSchema.index({ role: 1, isVerified: 1 });

// TTL index for expired sessions (remove sessions older than 30 days)
userSchema.index({ 'activeSessions.lastActive': 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// TTL index for security logs (remove logs older than 90 days)
userSchema.index({ 'securityLog.timestamp': 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Pre-save middleware for password hashing
userSchema.pre<IUser>('save', async function (next) {
  try {
    // Only hash password if it's modified
    if (!this.isModified('password')) {
      return next();
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(this.password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Hash password
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);

    logger.info('Password hashed for user', { userId: this._id, email: this.email });
    next();
  } catch (error) {
    logger.error('Error in password hashing middleware', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(error as Error);
  }
});

// Pre-save middleware for security logging
userSchema.pre<IUser>('save', function (next) {
  try {
    // Limit security log entries to last 100
    if (this.securityLog && this.securityLog.length > 100) {
      this.securityLog = this.securityLog.slice(-100);
    }

    // Limit active sessions to 10
    if (this.activeSessions && this.activeSessions.length > 10) {
      this.activeSessions = this.activeSessions.slice(-10);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance Methods
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Error comparing passwords', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  try {
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours

    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < new Date()) {
      return this.updateOne({
        $unset: { lockUntil: 1 },
        $set: { loginAttempts: 1 }
      });
    }

    const updates: any = { $inc: { loginAttempts: 1 } };

    // If we're at max attempts and not locked, lock the account
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
    }

    await this.updateOne(updates);
  } catch (error) {
    logger.error('Error incrementing login attempts', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  try {
    await this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  } catch (error) {
    logger.error('Error resetting login attempts', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.addSecurityLog = async function (
  action: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: string
): Promise<void> {
  try {
    this.securityLog.push({
      action,
      ip,
      userAgent,
      timestamp: new Date(),
      success,
      details
    });

    // Keep only last 100 entries
    if (this.securityLog.length > 100) {
      this.securityLog = this.securityLog.slice(-100);
    }

    await this.save();
    logger.info('Security log entry added', { userId: this._id, action, success });
  } catch (error) {
    logger.error('Error adding security log', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

userSchema.methods.addSession = async function (
  sessionId: string,
  device: string,
  ip: string,
  userAgent: string,
  location?: string
): Promise<void> {
  try {
    // Remove existing session with same sessionId
    this.activeSessions = this.activeSessions.filter(
      (session: any) => session.sessionId !== sessionId
    );

    // Add new session
    this.activeSessions.push({
      sessionId,
      device,
      ip,
      location,
      userAgent,
      lastActive: new Date(),
      createdAt: new Date()
    });

    // Keep only last 10 sessions
    if (this.activeSessions.length > 10) {
      this.activeSessions = this.activeSessions.slice(-10);
    }

    await this.save();
    logger.info('Session added', { userId: this._id, sessionId, device });
  } catch (error) {
    logger.error('Error adding session', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

userSchema.methods.removeSession = async function (sessionId: string): Promise<void> {
  try {
    this.activeSessions = this.activeSessions.filter(
      (session: any) => session.sessionId !== sessionId
    );
    await this.save();
    logger.info('Session removed', { userId: this._id, sessionId });
  } catch (error) {
    logger.error('Error removing session', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

userSchema.methods.clearOtherSessions = async function (currentSessionId: string): Promise<void> {
  try {
    const currentSession = this.activeSessions.find(
      (session: any) => session.sessionId === currentSessionId
    );

    this.activeSessions = currentSession ? [currentSession] : [];
    await this.save();
    logger.info('Other sessions cleared', { userId: this._id, currentSessionId });
  } catch (error) {
    logger.error('Error clearing other sessions', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({ isVerified: true, lockUntil: { $exists: false } });
};

userSchema.statics.findByRole = function (role: string) {
  return this.find({ role, isVerified: true });
};

// Create and export the model
const User = mongoose.model<IUser>('User', userSchema);

export default User;
