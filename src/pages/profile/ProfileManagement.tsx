import React from 'react';
import { User } from 'lucide-react';

const ProfileManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Management</h2>
        <p className="text-gray-600">
          This page will allow users to manage their profile information and settings.
        </p>
      </div>
    </div>
  );
};

export default ProfileManagement;
