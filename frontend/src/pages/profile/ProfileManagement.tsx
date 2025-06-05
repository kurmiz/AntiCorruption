import React, { useState } from 'react';
import {
  User,
  Shield,
  Settings,
  Activity,
  Bell,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import UserInformation from './sections/UserInformation';
import SecuritySettings from './sections/SecuritySettings';
import Preferences from './sections/Preferences';
import AccountUtilities from './sections/AccountUtilities';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ProfileManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs: TabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      component: <UserInformation />
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-5 w-5" />,
      component: <SecuritySettings />
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Settings className="h-5 w-5" />,
      component: <Preferences />
    },
    {
      id: 'account',
      label: 'Account',
      icon: <Activity className="h-5 w-5" />,
      component: <AccountUtilities />
    }
  ];

  return (
    <div className="profile-management">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <h1 className="profile-title">Profile Management</h1>
          <p className="profile-subtitle">
            Manage your account settings, security preferences, and personal information
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <nav className="profile-tab-nav" role="tablist" aria-label="Profile settings navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="profile-tab-icon">{tab.icon}</span>
              <span className="profile-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`profile-panel ${activeTab === tab.id ? 'active' : 'hidden'}`}
          >
            {tab.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileManagement;
