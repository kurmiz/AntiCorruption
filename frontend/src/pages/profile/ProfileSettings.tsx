import React from 'react';
import UserInformation from './sections/UserInformation';

const ProfileSettings: React.FC = () => {
  return (
    <div className="page-content">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <UserInformation />
    </div>
  );
};

export default ProfileSettings;
