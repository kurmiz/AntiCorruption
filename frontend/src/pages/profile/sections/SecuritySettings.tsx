import React, { useState } from 'react';

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

const SecuritySettings: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailVerified: true, // This would typically come from your backend
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setSecurityData((prev) => ({
      ...prev,
      [name]: name === 'twoFactorEnabled' ? checked : value,
    }));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically validate passwords and send to your API
    console.log('Changing password:', securityData);
  };

  const handleResendVerification = () => {
    // Here you would typically trigger a new verification email
    console.log('Resending verification email...');
  };

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password *
            </label>
            <input
              required
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={securityData.currentPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password *
            </label>
            <input
              required
              id="newPassword"
              name="newPassword"
              type="password"
              value={securityData.newPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password *
            </label>
            <input
              required
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={securityData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={securityData.twoFactorEnabled}
            onChange={handleInputChange}
            name="twoFactorEnabled"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Enable two-factor authentication
          </span>
        </label>
        <p className="text-sm text-gray-500">
          Two-factor authentication adds an extra layer of security to your
          account by requiring more than just a password to sign in.
        </p>
      </div>

      {/* Email Verification Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Email Verification</h2>
        {securityData.emailVerified ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              Your email has been verified!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                Your email is not verified. Please verify your email to access all
                features.
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Resend Verification Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
