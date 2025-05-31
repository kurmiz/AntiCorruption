import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabel = false
}) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  const currentOption = themeOptions.find(option => option.value === theme);
  const currentIcon = actualTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-btn ${sizeClasses[size]}`}
        aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
        title={`Current: ${actualTheme} mode. Click to toggle.`}
      >
        {currentIcon}
        {showLabel && (
          <span className="ml-2 hidden sm:inline">
            {actualTheme === 'light' ? 'Light' : 'Dark'}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="theme-dropdown">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`theme-dropdown-btn ${sizeClasses[size]}`}
        aria-label="Theme options"
        aria-expanded={dropdownOpen}
      >
        {currentOption?.icon}
        {showLabel && (
          <span className="ml-2 hidden sm:inline">
            {currentOption?.label}
          </span>
        )}
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="theme-dropdown-backdrop"
            onClick={() => setDropdownOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="theme-dropdown-menu">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setDropdownOpen(false);
                }}
                className={`theme-dropdown-item ${theme === option.value ? 'active' : ''}`}
                aria-label={`Switch to ${option.label.toLowerCase()} mode`}
              >
                {option.icon}
                <span>{option.label}</span>
                {theme === option.value && (
                  <div className="theme-dropdown-check">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
