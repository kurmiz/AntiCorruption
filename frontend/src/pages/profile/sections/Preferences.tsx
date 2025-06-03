import React, { useState } from 'react';

interface PreferencesData {
  language: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  profileVisibility: 'public' | 'private' | 'contacts';
  defaultDashboard: string;
}

const Preferences: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    language: 'en',
    theme: 'system',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    profileVisibility: 'public',
    defaultDashboard: 'overview',
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language and Theme */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="language"
            name="language"
            value={preferences.language}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <select
            id="theme"
            name="theme"
            value={preferences.theme}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Timezone */}
        <div className="md:col-span-2">
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={preferences.timezone}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={preferences.emailNotifications}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Email Notifications
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="pushNotifications"
              checked={preferences.pushNotifications}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Push Notifications
            </span>
          </label>
        </div>
      </div>

      {/* Profile Visibility */}
      <div>
        <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 mb-1">
          Profile Visibility
        </label>
        <select
          id="profileVisibility"
          name="profileVisibility"
          value={preferences.profileVisibility}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="contacts">Contacts Only</option>
        </select>
      </div>

      {/* Default Dashboard */}
      <div>
        <label htmlFor="defaultDashboard" className="block text-sm font-medium text-gray-700 mb-1">
          Default Dashboard
        </label>
        <select
          id="defaultDashboard"
          name="defaultDashboard"
          value={preferences.defaultDashboard}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="overview">Overview</option>
          <option value="analytics">Analytics</option>
          <option value="reports">Reports</option>
        </select>
      </div>
    </div>
  );
};

export default Preferences;
