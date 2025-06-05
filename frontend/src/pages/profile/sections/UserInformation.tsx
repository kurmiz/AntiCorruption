import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Mail, Phone, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { User as GlobalUser } from '../../../types';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const UserInformation: React.FC = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const initialData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      };
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [user]);

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);

    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitStatus({ success: false, message: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitStatus({ success: false, message: 'Please select a valid image file' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || authLoading || isSubmitting) return;

    if (!validateForm()) {
      setSubmitStatus({ success: false, message: 'Please fix the errors below' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const updatePayload: Partial<GlobalUser> = {
      id: user.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    };

    if (formData.avatar && formData.avatar.startsWith('data:image')) {
      updatePayload.avatar = formData.avatar;
    }

    try {
      await updateUser(updatePayload);
      setSubmitStatus({ success: true, message: 'Profile updated successfully!' });
      setHasChanges(false);
    } catch (error: any) {
      setSubmitStatus({ success: false, message: error.message || 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="user-information">
      <form onSubmit={handleSubmit} className="user-form">
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
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-container">
            <div
              onClick={handleAvatarClick}
              className="avatar-wrapper"
              tabIndex={0}
              role="button"
              aria-label="Change profile picture"
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Profile"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {formData.firstName ? (
                    <span className="avatar-initials">
                      {formData.firstName[0].toUpperCase()}
                    </span>
                  ) : (
                    <User className="avatar-icon" />
                  )}
                </div>
              )}
              <div className="avatar-overlay">
                <Camera className="h-6 w-6" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="avatar-edit-btn"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
          <p className="avatar-hint">Click to change profile picture</p>
        </div>
        {/* Form Fields */}
        <div className="form-fields">
          {/* First Name */}
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              <User className="h-4 w-4" />
              First Name
              <span className="required">*</span>
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`form-input ${errors.firstName ? 'error' : ''}`}
              placeholder="Enter your first name"
              required
              disabled={isSubmitting}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.firstName}</span>
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              <User className="h-4 w-4" />
              Last Name
              <span className="required">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`form-input ${errors.lastName ? 'error' : ''}`}
              placeholder="Enter your last name"
              required
              disabled={isSubmitting}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.lastName}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail className="h-4 w-4" />
              Email Address
              <span className="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              className="form-input readonly"
              autoComplete="email"
            />
            <p className="field-hint">
              Email changes require verification through security settings
            </p>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="Enter your phone number"
              disabled={isSubmitting}
              autoComplete="tel"
            />
            {errors.phone && (
              <div className="error-message">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>
        </div>
        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || authLoading || !hasChanges}
            className="submit-btn"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>

          {hasChanges && (
            <p className="changes-indicator">
              You have unsaved changes
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserInformation;
