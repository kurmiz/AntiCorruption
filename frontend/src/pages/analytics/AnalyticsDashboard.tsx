import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RealTimeDashboard from '../../components/analytics/RealTimeDashboard';
import RealTimeNotifications from '../../components/notifications/RealTimeNotifications';
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Filter,
  Download,
  Share2,
  Settings,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import '../../styles/real-time-dashboard.css';
import '../../styles/real-time-notifications.css';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    location: '',
    priority: ''
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'realtime', label: 'Real-Time', icon: Clock }
  ];

  const dateRanges = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportData = () => {
    console.log('Exporting analytics data...');
    // Implement data export functionality
  };

  const shareReport = () => {
    console.log('Sharing analytics report...');
    // Implement report sharing functionality
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`analytics-dashboard ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1 className="page-title">
            <BarChart3 className="h-7 w-7" />
            Analytics Dashboard
          </h1>
          <p className="page-subtitle">
            Real-time insights and comprehensive reporting analytics
          </p>
        </div>

        <div className="header-right">
          <RealTimeNotifications />
          
          <div className="header-actions">
            <button onClick={exportData} className="action-btn">
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button onClick={shareReport} className="action-btn">
              <Share2 className="h-4 w-4" />
              Share
            </button>
            
            <button onClick={toggleFullscreen} className="action-btn">
              <Maximize2 className="h-4 w-4" />
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
            
            <button className="action-btn settings">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-nav">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="nav-controls">
          {/* Date Range Selector */}
          <div className="control-group">
            <label className="control-label">Time Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="control-select"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="control-group">
            <button className="filter-btn">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel">
        <div className="filter-grid">
          <div className="filter-item">
            <label className="filter-label">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="bribery">Bribery</option>
              <option value="fraud">Fraud</option>
              <option value="embezzlement">Embezzlement</option>
              <option value="abuse_of_power">Abuse of Power</option>
              <option value="nepotism">Nepotism</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="filter-select"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Location:</label>
            <input
              type="text"
              placeholder="City, State"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <RealTimeDashboard />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="tab-content">
            <div className="coming-soon">
              <TrendingUp className="h-12 w-12 text-gray-400" />
              <h3>Trends Analysis</h3>
              <p>Advanced trend analysis and forecasting coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="tab-content">
            <div className="coming-soon">
              <MapPin className="h-12 w-12 text-gray-400" />
              <h3>Location Analytics</h3>
              <p>Geographic distribution and heatmaps coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="coming-soon">
              <Users className="h-12 w-12 text-gray-400" />
              <h3>User Analytics</h3>
              <p>User engagement and behavior analysis coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="tab-content">
            <RealTimeDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
