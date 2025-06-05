import React, { useState } from 'react';
import {
  Activity,
  Download,
  Trash2,
  Monitor,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  LogOut,
  FileText,
  AlertCircle
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  device: string;
  location: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const AccountUtilities: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      action: 'Login',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      timestamp: '2024-01-15T15:30:00Z',
      status: 'success',
    },
    {
      id: '2',
      action: 'Password Changed',
      device: 'Firefox on MacOS',
      location: 'Delhi, India',
      timestamp: '2024-01-14T10:15:00Z',
      status: 'success',
    },
    {
      id: '3',
      action: 'Failed Login Attempt',
      device: 'Unknown Device',
      location: 'Unknown Location',
      timestamp: '2024-01-13T08:45:00Z',
      status: 'error',
    },
  ]);

  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      lastActive: '2024-01-15T15:30:00Z',
      current: true,
    },
    {
      id: '2',
      device: 'Mobile App on iPhone',
      location: 'Delhi, India',
      lastActive: '2024-01-15T14:45:00Z',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on MacOS',
      location: 'Bangalore, India',
      lastActive: '2024-01-14T10:15:00Z',
      current: false,
    },
  ]);

  const handleLogoutOtherDevices = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus({ success: true, message: 'Successfully logged out from other devices' });
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to logout from other devices' });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus({ success: true, message: 'Data export initiated. You will receive an email with download link.' });
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus({ success: true, message: 'Account deletion request submitted' });
      setDeleteDialogOpen(false);
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Failed to delete account' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="account-utilities">
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

      <div className="utilities-grid">
        {/* Activity Logs Section */}
        <div className="utility-section">
          <div className="section-header">
            <div className="section-title">
              <Activity className="h-6 w-6" />
              <h2>Recent Activity</h2>
            </div>
            <p className="section-description">
              Monitor your account activity and security events
            </p>
          </div>

          <div className="activity-list">
            {activityLogs.map((log) => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">
                  {getStatusIcon(log.status)}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h3>{log.action}</h3>
                    <span className="activity-time">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-device">
                      <Monitor className="h-3 w-3" />
                      {log.device}
                    </span>
                    <span className="activity-location">
                      <MapPin className="h-3 w-3" />
                      {log.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions Section */}
        <div className="utility-section">
          <div className="section-header">
            <div className="section-title">
              <Monitor className="h-6 w-6" />
              <h2>Active Sessions</h2>
            </div>
            <p className="section-description">
              Manage devices that are currently signed in to your account
            </p>
          </div>

          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.id} className={`session-item ${session.current ? 'current' : ''}`}>
                <div className="session-icon">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="session-content">
                  <div className="session-header">
                    <h3>{session.device}</h3>
                    {session.current && (
                      <span className="current-badge">Current Session</span>
                    )}
                  </div>
                  <div className="session-details">
                    <span className="session-location">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </span>
                    <span className="session-time">
                      <Clock className="h-3 w-3" />
                      {session.current ? 'Active now' : `Last active: ${formatDate(session.lastActive)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="session-actions">
            <button
              onClick={handleLogoutOtherDevices}
              className="action-btn secondary"
            >
              <LogOut className="h-4 w-4" />
              Logout Other Devices
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="utility-section">
          <div className="section-header">
            <div className="section-title">
              <FileText className="h-6 w-6" />
              <h2>Data Management</h2>
            </div>
            <p className="section-description">
              Export your data or manage your account
            </p>
          </div>

          <div className="data-actions">
            <div className="action-card">
              <div className="action-info">
                <h3>Export Data</h3>
                <p>Download a copy of all your data including reports, messages, and account information</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="action-btn primary"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            <div className="action-card danger">
              <div className="action-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="action-btn danger"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <p>
                Are you absolutely sure you want to delete your account? This action
                cannot be undone and will permanently delete all your data including:
              </p>
              <ul>
                <li>All your reports and submissions</li>
                <li>Account information and preferences</li>
                <li>Activity history and logs</li>
                <li>Any associated files or documents</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="action-btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="action-btn danger"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountUtilities;
