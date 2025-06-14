import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  Key,
  Save
} from 'lucide-react';
import { authApi } from '../../../services/api';

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const SecuritySettings: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailVerified: true,
  });

  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const validatePasswords = (): boolean => {
    const errors: PasswordErrors = {};

    if (!securityData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!securityData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (securityData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(securityData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: name === 'twoFactorEnabled' ? checked : value,
    }));

    // Clear specific field error when user starts typing
    if (passwordErrors[name as keyof PasswordErrors]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      setSubmitStatus({ success: false, message: 'Please fix the errors below' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      console.log('SecuritySettings: Submitting password change');

      const response = await authApi.updatePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        confirmPassword: securityData.confirmPassword
      });

      console.log('SecuritySettings: Password change response:', response);

      if (response.success) {
        setSubmitStatus({ success: true, message: 'Password updated successfully!' });
        setSecurityData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setPasswordErrors({});
      } else {
        setSubmitStatus({
          success: false,
          message: response.error || response.message || 'Failed to update password'
        });
      }
    } catch (error: any) {
      console.error('SecuritySettings: Password change error:', error);
      setSubmitStatus({
        success: false,
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus({ success: true, message: 'Verification email sent!' });
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to send verification email' });
    }
  };

  const handle2FAToggle = async () => {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newStatus = !securityData.twoFactorEnabled;
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: newStatus }));
      setSubmitStatus({
        success: true,
        message: `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to update 2FA settings' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="security-settings">
      {/* Status Messages */}
      {submitStatus && (
        <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
          <div className="status-icon">
            {submitStatus.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <span>{submitStatus.message}</span>
        </div>
      )}

      {/* Password Change Section */}
      <div className="security-section">
        <div className="section-header">
          <div className="section-title">
            <Lock className="h-6 w-6" />
            <h2>Change Password</h2>
          </div>
          <p className="section-description">
            Update your password to keep your account secure
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="security-form">
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword" className="form-label">
              <Key className="h-4 w-4" />
              Current Password
              <span className="required">*</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={securityData.currentPassword}
                onChange={handleInputChange}
                className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                placeholder="Enter your current password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="password-toggle"
                aria-label="Toggle password visibility"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordErrors.currentPassword}</span>
              </div>
            )}
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              <Lock className="h-4 w-4" />
              New Password
              <span className="required">*</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={securityData.newPassword}
                onChange={handleInputChange}
                className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                placeholder="Enter your new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="password-toggle"
                aria-label="Toggle password visibility"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordErrors.newPassword}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <Lock className="h-4 w-4" />
              Confirm New Password
              <span className="required">*</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={securityData.confirmPassword}
                onChange={handleInputChange}
                className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="password-toggle"
                aria-label="Toggle password visibility"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{passwordErrors.confirmPassword}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-btn"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="security-section">
        <div className="section-header">
          <div className="section-title">
            <Smartphone className="h-6 w-6" />
            <h2>Two-Factor Authentication</h2>
          </div>
          <p className="section-description">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="security-option">
          <div className="option-content">
            <div className="option-info">
              <h3>Authenticator App</h3>
              <p>Use an authenticator app to generate verification codes</p>
            </div>
            <div className="option-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={securityData.twoFactorEnabled}
                  onChange={handle2FAToggle}
                  disabled={isSubmitting}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {securityData.twoFactorEnabled && (
            <div className="option-details">
              <div className="status-badge success">
                <CheckCircle className="h-4 w-4" />
                <span>Two-factor authentication is enabled</span>
              </div>
              <p className="text-sm">
                Your account is protected with two-factor authentication.
                You'll need your authenticator app to sign in.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Email Verification Section */}
      <div className="security-section">
        <div className="section-header">
          <div className="section-title">
            <Mail className="h-6 w-6" />
            <h2>Email Verification</h2>
          </div>
          <p className="section-description">
            Verify your email address to secure your account
          </p>
        </div>

        <div className="verification-status">
          {securityData.emailVerified ? (
            <div className="status-card success">
              <div className="status-icon">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="status-content">
                <h3>Email Verified</h3>
                <p>Your email address has been successfully verified</p>
              </div>
            </div>
          ) : (
            <div className="status-card warning">
              <div className="status-icon">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="status-content">
                <h3>Email Not Verified</h3>
                <p>Please verify your email to access all features</p>
                <button
                  onClick={handleResendVerification}
                  className="verify-btn"
                  disabled={isSubmitting}
                >
                  <Mail className="h-4 w-4" />
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
