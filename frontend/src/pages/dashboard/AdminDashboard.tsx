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
  Settings,
  Shield,
  BarChart3,
  UserPlus
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - replace with actual API calls
  const stats = {
    totalReports: 156,
    totalUsers: 89,
    totalPoliceOfficers: 12,
    pendingReports: 23,
    resolvedReports: 98,
    rejectedReports: 35,
    unreadMessages: 7,
    reportsThisMonth: 34,
    newUsersThisMonth: 15
  };

  const recentActivity = [
    {
      id: '1',
      type: 'report_submitted',
      description: 'New report submitted: "Bribery at Municipal Office"',
      user: 'John Doe',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'user_registered',
      description: 'New user registered',
      user: 'Jane Smith',
      timestamp: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      type: 'report_resolved',
      description: 'Report resolved: "Fraudulent Contract Award"',
      user: 'Officer Johnson',
      timestamp: '2024-01-15T08:45:00Z'
    },
    {
      id: '4',
      type: 'police_assigned',
      description: 'Report assigned to Officer Wilson',
      user: 'Admin',
      timestamp: '2024-01-14T16:20:00Z'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report_submitted':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'report_resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'police_assigned':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="page-content">
      {/* Welcome Section */}
      <div className="dashboard-welcome" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}>
        <h1 className="welcome-title">
          Admin Dashboard
        </h1>
        <p className="welcome-subtitle">
          System overview and management tools. You have {stats.pendingReports} pending reports requiring attention.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="action-cards">
        <Link
          to="/reports"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Reports</h3>
              <p className="text-sm text-gray-600">View and assign reports</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage users and roles</p>
            </div>
          </div>
        </Link>

        <Link
          to="/statistics"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-orange-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">View detailed statistics</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-purple-500"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600">System configuration</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Total Reports</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalReports}</p>
              <p className="text-xs text-gray-500">+{stats.reportsThisMonth} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Total Users</h3>
              <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500">+{stats.newUsersThisMonth} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Police Officers</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.totalPoliceOfficers}</p>
              <p className="text-xs text-gray-500">Active officers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Pending Reports</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
              <p className="text-xs text-gray-500">Require attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Resolved</h3>
              <p className="text-3xl font-bold text-green-600">{stats.resolvedReports}</p>
              <p className="text-sm text-gray-500">
                {Math.round((stats.resolvedReports / stats.totalReports) * 100)}% of total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingReports}</p>
              <p className="text-sm text-gray-500">
                {Math.round((stats.pendingReports / stats.totalReports) * 100)}% of total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Rejected</h3>
              <p className="text-3xl font-bold text-red-600">{stats.rejectedReports}</p>
              <p className="text-sm text-gray-500">
                {Math.round((stats.rejectedReports / stats.totalReports) * 100)}% of total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
