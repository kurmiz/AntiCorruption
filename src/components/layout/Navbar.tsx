import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

interface NavbarProps {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Left side */}
          <div className="navbar-left">
            <button
              onClick={onMenuClick}
              className="hamburger-menu-btn"
              type="button"
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              title={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="navbar-brand">
              <h1 className="navbar-title">
                Anti-Corruption Portal
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="navbar-right">
            {/* Theme Toggle */}
            <ThemeToggle variant="button" size="md" />

            {/* Notifications */}
            <button
              className="navbar-action-btn"
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* User dropdown */}
            <div className="navbar-dropdown">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="navbar-user-btn"
                aria-label="User menu"
                title="User menu"
              >
                <div className="navbar-avatar">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="navbar-user-info">
                  <p className="navbar-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="navbar-user-role">
                    {user?.role}
                  </p>
                </div>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </a>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dropdown backdrop */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
