import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../services/api';
import RealTimeNotifications from '../../components/notifications/RealTimeNotifications';
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp,
  Bell,
  Search,
  BarChart3,
  MapPin,
  Calendar,
  Activity,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Home,
  Eye,
  Shield
} from 'lucide-react';
import '../../styles/citizen-dashboard.css';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    rejectedReports: 0,
    unreadMessages: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show empty state if no reports
  const showEmptyState = stats.totalReports === 0;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch all reports (including anonymous ones for testing)
        console.log('🔍 DEBUGGING: Fetching reports for dashboard...');
        const reportsResponse = await reportsApi.getReports({}, 1, 5);

        console.log('🔍 DEBUGGING: Reports response:', reportsResponse);

        if (reportsResponse.success && reportsResponse.data) {
          const reports = reportsResponse.data.reports || reportsResponse.data;
          console.log('🔍 DEBUGGING: Extracted reports:', reports);

          setRecentReports(Array.isArray(reports) ? reports : []);

          // Calculate stats from reports
          const totalReports = Array.isArray(reports) ? reports.length : 0;
          const pendingReports = Array.isArray(reports) ? reports.filter((r: any) => r.status === 'pending').length : 0;
          const resolvedReports = Array.isArray(reports) ? reports.filter((r: any) => r.status === 'resolved').length : 0;

          console.log('🔍 DEBUGGING: Calculated stats:', { totalReports, pendingReports, resolvedReports });

          setStats({
            totalReports,
            pendingReports,
            resolvedReports,
            rejectedReports: 0, // TODO: Calculate from actual data
            unreadMessages: 2 // Mock unread messages
          });
        } else {
          console.warn('❌ DEBUGGING: Failed to fetch reports:', reportsResponse.error);
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
  };

  // Mock recent activity data
  const mockActivity = [
    {
      id: 1,
      type: 'report_submitted',
      title: 'New report submitted',
      description: 'Report #CR-2024-001 has been submitted successfully',
      time: '2 hours ago',
      icon: FileText,
      color: 'var(--primary-blue)'
    },
    {
      id: 2,
      type: 'status_update',
      title: 'Report status updated',
      description: 'Report #CR-2024-002 is now under investigation',
      time: '1 day ago',
      icon: Clock,
      color: 'var(--warning-yellow)'
    },
    {
      id: 3,
      type: 'report_resolved',
      title: 'Report resolved',
      description: 'Report #CR-2024-003 has been successfully resolved',
      time: '3 days ago',
      icon: CheckCircle,
      color: 'var(--success-green)'
    }
  ];

  return (
    <div className="citizen-dashboard" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Header (Top Bar) */}
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/" className="app-logo">
            <Shield className="h-8 w-8" />
            AntiCorruption Portal
          </Link>
        </div>

        <div className="header-right">
          <RealTimeNotifications />

          <div className="header-controls">
            <button className="control-btn" onClick={toggleDarkMode} title="Toggle theme">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="control-btn" title="Language">
              <Globe className="h-5 w-5" />
            </button>
          </div>

          <div className="user-dropdown">
            <div className="user-avatar" title={`${user?.firstName} ${user?.lastName}`}>
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar (Persistent Left Menu) */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <Home className="h-5 w-5" />
            Dashboard
          </Link>

          <Link to="/reports/new" className="nav-item">
            <Plus className="h-5 w-5" />
            Submit Report
          </Link>

          <Link to="/reports" className="nav-item">
            <FileText className="h-5 w-5" />
            My Reports
          </Link>

          <Link to="/messages" className="nav-item">
            <MessageSquare className="h-5 w-5" />
            Messages
            {stats.unreadMessages > 0 && (
              <span className="message-badge">{stats.unreadMessages}</span>
            )}
          </Link>

          <Link to="/profile" className="nav-item">
            <User className="h-5 w-5" />
            Profile
          </Link>
        </nav>
      </aside>

      {/* Main Dashboard Body */}
      <main className="dashboard-main">
        {/* Error Message */}
        {error && (
          <div style={{
            background: 'var(--emergency-red)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <h1 className="welcome-title">
            Welcome back, {user?.firstName || 'User'}! Thank you for contributing to a more transparent society.
          </h1>
          <p className="welcome-subtitle">
            Your reports make a difference. Together, we're building a corruption-free future.
          </p>
        </div>

        {/* Summary Metrics (Top Row - Cards) */}
        <div className="metrics-grid">
          <div className="metric-card total" onClick={() => console.log('Navigate to all reports')}>
            <div className="metric-header">
              <div className="metric-icon">
                <FileText className="h-6 w-6" />
              </div>
              <Eye className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="metric-content">
              <h3>Total Reports</h3>
              <div className="metric-value">{stats.totalReports}</div>
            </div>
          </div>

          <div className="metric-card pending" onClick={() => console.log('Navigate to pending reports')}>
            <div className="metric-header">
              <div className="metric-icon">
                <Clock className="h-6 w-6" />
              </div>
              <Eye className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="metric-content">
              <h3>Pending Reports</h3>
              <div className="metric-value">{stats.pendingReports}</div>
            </div>
          </div>

          <div className="metric-card resolved" onClick={() => console.log('Navigate to resolved reports')}>
            <div className="metric-header">
              <div className="metric-icon">
                <CheckCircle className="h-6 w-6" />
              </div>
              <Eye className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="metric-content">
              <h3>Resolved Reports</h3>
              <div className="metric-value">{stats.resolvedReports}</div>
            </div>
          </div>

          <div className="metric-card rejected" onClick={() => console.log('Navigate to rejected reports')}>
            <div className="metric-header">
              <div className="metric-icon">
                <XCircle className="h-6 w-6" />
              </div>
              <Eye className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="metric-content">
              <h3>Rejected Reports</h3>
              <div className="metric-value">{stats.rejectedReports}</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons (Middle Row) */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/reports/new" className="action-button primary">
              <Plus className="action-icon" />
              Submit New Report
            </Link>

            <Link to="/reports/emergency" className="action-button emergency">
              <AlertTriangle className="action-icon" />
              Emergency Report
            </Link>

            <Link to="/reports/anonymous" className="action-button success">
              <MessageSquare className="action-icon" />
              Anonymous Tip
            </Link>

            <Link to="/reports/track" className="action-button purple">
              <Search className="action-icon" />
              Track Reports
            </Link>
          </div>
        </div>

        {/* Dashboard Grid (Bottom) */}
        <div className="dashboard-grid">
          {/* Recent Activity Feed (Bottom Left Panel) */}
          <div className="activity-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h3>
            </div>
            <div className="activity-list">
              {mockActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <div
                      className="activity-icon"
                      style={{ background: activity.color, color: 'white' }}
                    >
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="activity-details">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corruption Trends / Statistics (Bottom Right Panel) */}
          <div className="trends-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <BarChart3 className="h-5 w-5" />
                Corruption Trends
              </h3>
            </div>
            <div className="trends-content">
              <div className="trend-item">
                <span className="trend-label">Reports by Category</span>
                <span className="trend-value">Bribery (45%)</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">Most Affected Area</span>
                <span className="trend-value">Public Services</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">Resolution Rate</span>
                <span className="trend-value">78%</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">Average Response Time</span>
                <span className="trend-value">5.2 days</span>
              </div>
              <div className="trend-item">
                <span className="trend-label">Reports This Month</span>
                <span className="trend-value">+23% ↗</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Unread Messages Widget (Floating) */}
      {stats.unreadMessages > 0 && (
        <Link to="/messages" className="messages-widget">
          <MessageSquare className="h-6 w-6" />
          <span className="message-badge">{stats.unreadMessages}</span>
        </Link>
      )}
    </div>
  );
};

export default UserDashboard;
