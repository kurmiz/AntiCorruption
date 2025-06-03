import React from 'react';
import ProfileSettings from './ProfileSettings';

const ProfileManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <ProfileSettings />
      </div>
    </div>
  );
};

export default ProfileManagement;
