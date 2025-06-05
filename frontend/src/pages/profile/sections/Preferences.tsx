import React, { useState } from 'react';
import {
  Globe,
  Moon,
  Sun,
  Monitor,
  Clock,
  Bell,
  Eye,
  Layout,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface PreferencesData {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'public' | 'private' | 'contacts';
  defaultDashboard: string;
}

const Preferences: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<PreferencesData>({
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    defaultDashboard: 'overview',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmitStatus({ success: true, message: 'Preferences updated successfully!' });
      setHasChanges(false);
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to update preferences' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="preferences-settings">
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

        <form onSubmit={handleSubmit} className="preferences-form">
          {/* Appearance Section */}
          <div className="preferences-section">
            <div className="section-header">
              <div className="section-title">
                <Monitor className="h-6 w-6" />
                <h2>Appearance</h2>
              </div>
              <p className="section-description">
                Customize how the application looks and feels
              </p>
            </div>

            <div className="preference-group">
              <label className="preference-label">
                <Sun className="h-4 w-4" />
                Theme
              </label>
              <div className="theme-options">
                <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                >
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                >
                  <Monitor className="h-5 w-5" />
                  <span>System</span>
                </button>
              </div>
            </div>
          </div>

          {/* Localization Section */}
          <div className="preferences-section">
            <div className="section-header">
              <div className="section-title">
                <Globe className="h-6 w-6" />
                <h2>Localization</h2>
              </div>
              <p className="section-description">
                Set your language and regional preferences
              </p>
            </div>

            <div className="preference-grid">
              <div className="preference-group">
                <label htmlFor="language" className="preference-label">
                  <Globe className="h-4 w-4" />
                  Language
                </label>
                <select
                    id="language"
                    name="language"
                    value={preferences.language}
                    onChange={handleSelectChange}
                    className="preference-select"
                    disabled={isSubmitting}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="preference-group">
                <label htmlFor="timezone" className="preference-label">
                  <Clock className="h-4 w-4" />
                  Timezone
                </label>
                <select
                    id="timezone"
                    name="timezone"
                    value={preferences.timezone}
                    onChange={handleSelectChange}
                    className="preference-select"
                    disabled={isSubmitting}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="preferences-section">
            <div className="section-header">
              <div className="section-title">
                <Bell className="h-6 w-6" />
                <h2>Notifications</h2>
              </div>
              <p className="section-description">
                Choose how you want to be notified about updates
              </p>
            </div>

            <div className="notification-options">
              <div className="notification-option">
                <div className="option-content">
                  <div className="option-info">
                    <h3>Email Notifications</h3>
                    <p>Receive updates and alerts via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={handleCheckboxChange}
                        name="emailNotifications"
                        disabled={isSubmitting}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="notification-option">
                <div className="option-content">
                  <div className="option-info">
                    <h3>Push Notifications</h3>
                    <p>Get instant notifications in your browser</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={preferences.pushNotifications}
                        onChange={handleCheckboxChange}
                        name="pushNotifications"
                        disabled={isSubmitting}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="preferences-section">
            <div className="section-header">
              <div className="section-title">
                <Eye className="h-6 w-6" />
                <h2>Privacy</h2>
              </div>
              <p className="section-description">
                Control who can see your profile and activity
              </p>
            </div>

            <div className="preference-group">
              <label htmlFor="profileVisibility" className="preference-label">
                <Eye className="h-4 w-4" />
                Profile Visibility
              </label>
              <select
                  id="profileVisibility"
                  name="profileVisibility"
                  value={preferences.profileVisibility}
                  onChange={handleSelectChange}
                  className="preference-select"
                  disabled={isSubmitting}
              >
                <option value="public">Public - Anyone can see your profile</option>
                <option value="contacts">Contacts Only - Only your contacts can see your profile</option>
                <option value="private">Private - Only you can see your profile</option>
              </select>
            </div>
          </div>

          {/* Dashboard Section */}
          <div className="preferences-section">
            <div className="section-header">
              <div className="section-title">
                <Layout className="h-6 w-6" />
                <h2>Dashboard</h2>
              </div>
              <p className="section-description">
                Customize your dashboard experience
              </p>
            </div>

            <div className="preference-group">
              <label htmlFor="defaultDashboard" className="preference-label">
                <Layout className="h-4 w-4" />
                Default Dashboard View
              </label>
              <select
                  id="defaultDashboard"
                  name="defaultDashboard"
                  value={preferences.defaultDashboard}
                  onChange={handleSelectChange}
                  className="preference-select"
                  disabled={isSubmitting}
              >
                <option value="overview">Overview - General dashboard</option>
                <option value="reports">Reports - Focus on reports</option>
                <option value="analytics">Analytics - Data and statistics</option>
                <option value="activity">Activity - Recent activity feed</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
                type="submit"
                disabled={isSubmitting || !hasChanges}
                className="submit-btn"
            >
              <Save className="h-5 w-5" />
              {isSubmitting ? 'Saving Preferences...' : 'Save Preferences'}
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

export default Preferences;