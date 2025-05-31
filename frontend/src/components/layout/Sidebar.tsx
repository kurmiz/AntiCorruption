import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  Home,
  FileText,
  MessageSquare,
  BarChart3,
  User,
  Users,
  Settings,
  X,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    roles: [UserRole.USER, UserRole.POLICE, UserRole.ADMIN]
  },
  {
    label: 'Submit Report',
    path: '/reports/new',
    icon: AlertTriangle,
    roles: [UserRole.USER]
  },
  {
    label: 'My Reports',
    path: '/profile/reports',
    icon: FileText,
    roles: [UserRole.USER]
  },
  {
    label: 'All Reports',
    path: '/reports',
    icon: FileText,
    roles: [UserRole.POLICE, UserRole.ADMIN]
  },
  {
    label: 'Messages',
    path: '/messages',
    icon: MessageSquare,
    roles: [UserRole.USER, UserRole.POLICE, UserRole.ADMIN]
  },
  {
    label: 'Statistics',
    path: '/statistics',
    icon: BarChart3,
    roles: [UserRole.POLICE, UserRole.ADMIN]
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: [UserRole.USER, UserRole.POLICE, UserRole.ADMIN]
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    roles: ['admin']
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sidebar-backdrop lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${!isOpen ? 'sidebar-hidden' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Shield className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <span className="sidebar-title">
              Anti-Corruption
            </span>
          </div>
          <button
            onClick={onClose}
            className="sidebar-toggle"
            type="button"
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Main menu">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveLink(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="sidebar-profile">
          <div
            className="profile-info tooltip"
            data-tooltip="View profile"
            tabIndex={0}
            role="button"
            aria-label={`User profile: ${user?.firstName} ${user?.lastName}, ${user?.role}`}
          >
            <div className="profile-avatar">
              <User className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="profile-details">
              <h4>{user?.firstName} {user?.lastName}</h4>
              <p className="capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
