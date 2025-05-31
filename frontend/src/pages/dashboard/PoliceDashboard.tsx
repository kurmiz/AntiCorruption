import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Eye,
  UserCheck
} from 'lucide-react';

const PoliceDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - replace with actual API calls
  const stats = {
    totalReports: 45,
    assignedToMe: 8,
    pendingReports: 12,
    resolvedReports: 28,
    rejectedReports: 5,
    unreadMessages: 3
  };

  const assignedReports = [
    {
      id: '1',
      title: 'Bribery at Municipal Office',
      status: 'under_investigation',
      priority: 'high',
      submittedBy: 'John Doe',
      createdAt: '2024-01-15',
      category: 'Bribery'
    },
    {
      id: '2',
      title: 'Fraudulent Contract Award',
      status: 'pending',
      priority: 'medium',
      submittedBy: 'Jane Smith',
      createdAt: '2024-01-14',
      category: 'Fraud'
    },
    {
      id: '3',
      title: 'Embezzlement of Public Funds',
      status: 'under_investigation',
      priority: 'urgent',
      submittedBy: 'Anonymous',
      createdAt: '2024-01-13',
      category: 'Embezzlement'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_investigation':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="page-content">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1 className="welcome-title">
          Welcome, Officer {user?.lastName}
        </h1>
        <p className="welcome-subtitle">
          You have {stats.assignedToMe} reports assigned to you and {stats.unreadMessages} unread messages.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="action-cards">
        <Link
          to="/reports"
          className="action-card"
          style={{ borderLeft: '4px solid #3b82f6' }}
          aria-label="View and manage all reports"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileText className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">All Reports</h3>
              <p className="action-description">View and manage all corruption reports</p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports?assigned=me"
          className="action-card"
          style={{ borderLeft: '4px solid #f97316' }}
          aria-label="View reports assigned to you"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <UserCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Assigned to Me</h3>
              <p className="action-description">{stats.assignedToMe} reports requiring your attention</p>
            </div>
          </div>
        </Link>

        <Link
          to="/messages"
          className="action-card"
          style={{ borderLeft: '4px solid #16a34a' }}
          aria-label="View messages and communications"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <MessageSquare className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Messages</h3>
              <p className="action-description">
                {stats.unreadMessages > 0 ? `${stats.unreadMessages} unread messages` : 'No new messages'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/statistics"
          className="action-card"
          style={{ borderLeft: '4px solid #9333ea' }}
          aria-label="View analytics and statistics"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
              <TrendingUp className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Statistics</h3>
              <p className="action-description">View detailed analytics and insights</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <FileText className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Total Reports</h3>
              <p>{stats.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Assigned</h3>
              <p>{stats.assignedToMe}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon yellow">
              <Clock className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Pending</h3>
              <p>{stats.pendingReports}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Resolved</h3>
              <p>{stats.resolvedReports}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Rejected</h3>
              <p>{stats.rejectedReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Reports */}
      <div className="recent-reports">
        <div className="recent-reports-header">
          <div className="flex items-center justify-between">
            <h2 className="recent-reports-title">Reports Assigned to Me</h2>
            <Link
              to="/reports?assigned=me"
              className="recent-reports-link"
            >
              View all
            </Link>
          </div>
        </div>
        <div>
          {assignedReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {report.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {report.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      By: {report.submittedBy}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.status)}
                    <span className="text-sm text-gray-600 capitalize">
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  <Link
                    to={`/reports/${report.id}`}
                    className="text-blue-600 hover:text-blue-500"
                    aria-label={`View details for ${report.title}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {assignedReports.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UserCheck className="w-full h-full" />
            </div>
            <h3>No assigned reports</h3>
            <p>
              You don't have any reports assigned to you at the moment.<br />
              Check back later or contact your supervisor for new assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceDashboard;
