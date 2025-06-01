import mongoose, { Schema, Document, Types } from 'mongoose'; // Added Types
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId; // Explicitly define _id type
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt?: Date; // Added for clarity, Mongoose handles this with timestamps
  updatedAt?: Date; // Added for clarity, Mongoose handles this with timestamps
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
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'police', 'admin'],
    default: 'citizen',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Note: Password hashing is currently handled in the auth.controller.ts during signup.
// If you prefer to handle it via a pre-save hook here, you can uncomment and adjust the following:
/*
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});
*/

// Method to compare password (can be used in login if not handled directly in controller)
// userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

const User = mongoose.model<IUser>('User', userSchema);

export default User;
