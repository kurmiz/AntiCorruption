import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
}

export interface IUserInput {
  email: string;
  password: string;
  name: string;
  role: 'citizen' | 'police' | 'admin';
  isVerified: boolean;
}
