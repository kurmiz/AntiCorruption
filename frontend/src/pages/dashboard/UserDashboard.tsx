import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../services/api';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    unreadMessages: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Show empty state if no reports
  const showEmptyState = stats.totalReports === 0;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch user's reports
        const reportsResponse = await reportsApi.getMyReports({ page: 1, limit: 5 });

        if (reportsResponse.success && reportsResponse.data) {
          const reports = reportsResponse.data.reports || reportsResponse.data;
          setRecentReports(Array.isArray(reports) ? reports : []);

          // Calculate stats from reports
          const totalReports = Array.isArray(reports) ? reports.length : 0;
          const pendingReports = Array.isArray(reports) ? reports.filter((r: any) => r.status === 'pending').length : 0;
          const resolvedReports = Array.isArray(reports) ? reports.filter((r: any) => r.status === 'resolved').length : 0;

          setStats({
            totalReports,
            pendingReports,
            resolvedReports,
            unreadMessages: 0 // TODO: Implement messages API
          });
        } else {
          console.warn('Failed to fetch reports:', reportsResponse.error);
          setRecentReports([]);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
        setRecentReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_investigation':
        return 'Under Investigation';
      case 'resolved':
        return 'Resolved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1 className="welcome-title">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="welcome-subtitle">
          Thank you for your commitment to fighting corruption. Your reports help create a more transparent society.
        </p>
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
              {showEmptyState && (
                <span className="text-xs text-gray-500 mt-1 block">
                  Start by submitting your first report
                </span>
              )}
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
      </div>

      {/* Quick Actions */}
      <div className="action-cards">
        <Link
          to="/reports/new"
          className="action-card"
          style={{ borderLeft: '4px solid #3b82f6' }}
          aria-label="Submit a new corruption report"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Plus className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Submit New Report</h3>
              <p className="action-description">Report a corruption incident safely and securely</p>
            </div>
          </div>
        </Link>

        <div
          className="action-card emergency"
          style={{ borderLeft: '4px solid #dc2626' }}
          role="button"
          tabIndex={0}
          aria-label="Submit an emergency corruption report"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Emergency Report</h3>
              <p className="action-description">Report urgent corruption cases requiring immediate attention</p>
            </div>
          </div>
        </div>

        <div
          className="action-card"
          style={{ borderLeft: '4px solid #16a34a' }}
          role="button"
          tabIndex={0}
          aria-label="Submit an anonymous tip"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <MessageSquare className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Anonymous Tip</h3>
              <p className="action-description">Submit anonymous information with complete privacy</p>
            </div>
          </div>
        </div>

        <Link
          to="/reports/track"
          className="action-card"
          style={{ borderLeft: '4px solid #9333ea' }}
          aria-label="Track the status of your reports"
        >
          <div className="action-header">
            <div className="action-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
              <TrendingUp className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="action-title">Track Report</h3>
              <p className="action-description">Check the status and progress of your reports</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Unread Messages</h3>
              <p>{stats.unreadMessages}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Reports This Month</h3>
              <p>3</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="stat-content">
              <h3>Success Rate</h3>
              <p>60%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="recent-reports">
        <div className="recent-reports-header">
          <div className="flex items-center justify-between">
            <h2 className="recent-reports-title">Recent Reports</h2>
            <Link to="/profile/reports" className="recent-reports-link">
              View all
            </Link>
          </div>
        </div>
        <div>
          {recentReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {report.title}
                  </h3>
                  <div className="mt-1 flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {report.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(report.status)}
                  <span className="text-sm text-gray-600">
                    {getStatusText(report.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {recentReports.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText className="w-full h-full" />
            </div>
            <h3>No reports submitted yet</h3>
            <p>
              Start making a difference by reporting corruption incidents.<br />
              Your voice matters in creating a transparent society.
            </p>
            <Link
              to="/reports/new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Your First Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
