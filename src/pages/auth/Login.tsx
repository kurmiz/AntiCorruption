import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ThemeToggle from '../../components/ui/ThemeToggle';
import '../../styles/auth.css';

// Define types locally to avoid import issues
interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await login(data);

      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.error || 'Login failed');
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

      {/* Login Form Container */}
      <div className="auth-card">
        {/* Form Header */}
        <div className="auth-header">
          <div className="auth-icon">
            <Shield />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <h2 className="auth-subtitle">Anti-Corruption Portal</h2>
          <p className="auth-description">
            Sign in to continue fighting corruption
          </p>
        </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <div className="error-alert-dot"></div>
              <span>{error}</span>
            </div>
          )}

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

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
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

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot your password?
            </Link>
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
                <span>Sign In</span>
                <ArrowRight size={24} />
              </>
            )}
          </button>

        {/* Quick Login Buttons */}
        <div className="quick-login-section">
          <p className="quick-login-title">Quick Demo Access</p>
          <div className="quick-login-buttons">
            <button
              type="button"
              onClick={() => {
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                if (emailInput && passwordInput) {
                  emailInput.value = 'police@anticorruption.com';
                  passwordInput.value = 'police123';
                }
              }}
              className="quick-login-btn"
            >
              <span style={{ fontSize: '1.125rem' }}>🚔</span>
              <span>Police Officer (Dipesh Kumar)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                if (emailInput && passwordInput) {
                  emailInput.value = 'user@anticorruption.com';
                  passwordInput.value = 'user123';
                }
              }}
              className="quick-login-btn citizen"
            >
              <span style={{ fontSize: '1.125rem' }}>👤</span>
              <span>Citizen User</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">New here?</span>
            <div className="auth-divider-line"></div>
          </div>
          <Link to="/register" className="btn-secondary">
            <span>Create Account</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
