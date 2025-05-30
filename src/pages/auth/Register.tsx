import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import '../../styles/auth.css';

// Define types locally to avoid import issues
enum UserRole {
  USER = 'user',
  POLICE = 'police',
  ADMIN = 'admin'
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: UserRole;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await registerUser(data);

      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20 }}>
        <ThemeToggle variant="button" size="md" />
      </div>

      {/* Animated Background Elements */}
      <div className="auth-bg-element auth-bg-element-1"></div>
      <div className="auth-bg-element auth-bg-element-2"></div>
      <div className="auth-bg-element auth-bg-element-3"></div>
      <div className="auth-bg-element auth-bg-element-4"></div>
      <div className="auth-bg-element auth-bg-element-5"></div>
      <div className="auth-bg-element auth-bg-element-6"></div>

      {/* Registration Form Container */}
      <div className="auth-card">
        {/* Form Header */}
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus />
          </div>
          <h1 className="auth-title">Join the Movement</h1>
          <h2 className="auth-subtitle">Create Your Account</h2>
          <p className="auth-description">
            Be part of the fight against corruption and help build a transparent society
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <div className="error-alert-dot"></div>
              <span>{error}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="form-group-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <div className="input-container">
                <User className="input-icon" size={20} />
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="Enter first name"
                />
              </div>
              {errors.firstName && (
                <div className="error-message animate-fadeIn">
                  <div className="error-dot"></div>
                  {errors.firstName.message}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <div className="input-container">
                <User className="input-icon" size={20} />
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className="form-input"
                  placeholder="Enter last name"
                />
              </div>
              {errors.lastName && (
                <div className="error-message animate-fadeIn">
                  <div className="error-dot"></div>
                  {errors.lastName.message}
                </div>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon" size={20} />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="form-input"
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <div className="error-message animate-fadeIn">
                <div className="error-dot"></div>
                {errors.email.message}
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label className="form-label">
              Phone Number <span style={{ color: 'rgba(6, 182, 212, 0.6)', fontWeight: 'normal', fontSize: '0.875rem' }}>(Optional)</span>
            </label>
            <div className="input-container">
              <Phone className="input-icon" size={20} />
              <input
                {...register('phone')}
                type="tel"
                className="form-input"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div className="select-container">
              <select
                {...register('role', { required: 'Role is required' })}
                className="select-input"
              >
                <option value="">Select your role</option>
                <option value={UserRole.USER}>👤 Citizen</option>
                <option value={UserRole.POLICE}>🚔 Police Officer</option>
              </select>
              <div className="select-arrow">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.role && (
              <div className="error-message animate-fadeIn">
                <div className="error-dot"></div>
                {errors.role.message}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <div className="error-message animate-fadeIn">
                <div className="error-dot"></div>
                {errors.password.message}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="error-message animate-fadeIn">
                <div className="error-dot"></div>
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">Already a member?</span>
            <div className="auth-divider-line"></div>
          </div>
          <Link to="/login" className="btn-secondary">
            <span>Sign In</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
