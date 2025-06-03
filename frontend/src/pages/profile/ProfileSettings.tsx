import React, { useState } from 'react';
import UserInformation from './sections/UserInformation';
import SecuritySettings from './sections/SecuritySettings';
import Preferences from './sections/Preferences';
import AppConfiguration from './sections/AppConfiguration';
import AccountUtilities from './sections/AccountUtilities';

const tabs = [
  { id: 0, label: '⚙️ Account Settings', component: UserInformation },
  { id: 1, label: '🔒 Security', component: SecuritySettings },
  { id: 2, label: '🌐 Preferences', component: Preferences },
  { id: 3, label: '🧩 Connected Apps', component: AppConfiguration },
  { id: 4, label: '🗑️ Danger Zone', component: AccountUtilities },
];

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={activeTab === tab.id ? 'block' : 'hidden'}
            >
              <tab.component />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
