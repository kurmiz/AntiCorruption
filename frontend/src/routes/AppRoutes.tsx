import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Layout Components
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Dashboard Pages
import UserDashboard from '../pages/dashboard/UserDashboard';
import PoliceDashboard from '../pages/dashboard/PoliceDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

// Report Pages
import ReportSubmission from '../pages/reports/ReportSubmission';
import ReportsList from '../pages/reports/ReportsList';
import ReportDetails from '../pages/reports/ReportDetails';

// Messaging Pages
import MessagingInterface from '../pages/messaging/MessagingInterface';

// Profile Pages
import ProfileManagement from '../pages/profile/ProfileManagement';
import MyReports from '../pages/profile/MyReports';

// Statistics Pages
import StatisticsDashboard from '../pages/statistics/StatisticsDashboard';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('ProtectedRoute: Evaluating access. isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'User:', user);

  if (isLoading) {
    console.log('ProtectedRoute: isLoading is true, rendering LoadingSpinner.');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated here
  console.log('ProtectedRoute: Authenticated. User role:', user?.role);

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute: Role not allowed. User role: ${user.role}, Allowed roles: ${allowedRoles}. Redirecting to /unauthorized.`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute: Access granted.');
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Dashboard Route Component (role-based routing)
const DashboardRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.POLICE:
      return <PoliceDashboard />;
    case UserRole.USER:
    default:
      return <UserDashboard />;
  }
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute />} />

        {/* Reports */}
        <Route path="reports">
          <Route index element={<ReportsList />} />
          <Route path="new" element={<ReportSubmission />} />
          <Route path=":id" element={<ReportDetails />} />
        </Route>

        {/* Messaging */}
        <Route path="messages" element={<MessagingInterface />} />

        {/* Profile */}
        <Route path="profile">
          <Route index element={<ProfileManagement />} />
          <Route path="reports" element={<MyReports />} />
        </Route>

        {/* Statistics (Admin and Police only) */}
        <Route
          path="statistics"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.POLICE]}>
              <StatisticsDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <Routes>
                <Route path="users" element={<div>User Management</div>} />
                <Route path="settings" element={<div>System Settings</div>} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>} />

      <Route path="*" element={<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>} />
    </Routes>
  );
};

export default AppRoutes;
