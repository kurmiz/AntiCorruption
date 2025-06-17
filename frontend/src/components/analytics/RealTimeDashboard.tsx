import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  MapPin,
  Zap,
  RefreshCw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface RealTimeMetrics {
  reportsLastHour: number;
  reportsLast24Hours: number;
  activeUsers: number;
  pendingReports: number;
  urgentReports: number;
  averageResponseTime: number;
}

interface AnalyticsData {
  totalReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  reportsByCategory: CategoryData[];
  reportsByStatus: StatusData[];
  reportsByLocation: LocationData[];
  realTimeMetrics: RealTimeMetrics;
  trendAnalytics: TrendData;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface LocationData {
  city: string;
  state: string;
  count: number;
  categories: { [key: string]: number };
}

interface TrendData {
  daily: Array<{ date: string; count: number; categories: { [key: string]: number } }>;
  weekly: Array<{ week: string; count: number; change: number }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

const RealTimeDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    initializeRealTimeConnection();
    fetchInitialData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeRealTimeConnection = () => {
    console.log('🔌 Initializing WebSocket connection...');
    
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token') // If user is authenticated
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to real-time analytics');
      setConnected(true);
      
      // Subscribe to analytics updates
      socketRef.current?.emit('analytics:subscribe', { type: 'dashboard' });
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from real-time analytics');
      setConnected(false);
    });

    socketRef.current.on('analytics:update', (data: AnalyticsData) => {
      console.log('📊 Real-time analytics update received:', data);
      setAnalyticsData(data);
      setLastUpdate(new Date());
    });

    socketRef.current.on('report:new', (reportData: any) => {
      console.log('📝 New report received:', reportData);
      // Update metrics in real-time
      if (analyticsData) {
        setAnalyticsData(prev => prev ? {
          ...prev,
          totalReports: prev.totalReports + 1,
          reportsToday: prev.reportsToday + 1,
          realTimeMetrics: {
            ...prev.realTimeMetrics,
            reportsLastHour: prev.realTimeMetrics.reportsLastHour + 1,
            reportsLast24Hours: prev.realTimeMetrics.reportsLast24Hours + 1
          }
        } : null);
      }
      setLastUpdate(new Date());
    });

    socketRef.current.on('report:status:public', (statusData: any) => {
      console.log('📋 Report status update:', statusData);
      setLastUpdate(new Date());
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/analytics');
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchInitialData();
  };

  if (loading) {
    return (
      <div className="real-time-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="real-time-dashboard error">
        <div className="error-message">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p>Failed to load analytics data</p>
          <button onClick={refreshData} className="retry-btn">
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="real-time-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <Activity className="h-6 w-6" />
            Real-Time Analytics Dashboard
          </h1>
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{connected ? 'Live' : 'Offline'}</span>
            </div>
            <span className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button onClick={refreshData} className="refresh-btn">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card urgent">
          <div className="metric-icon">
            <Zap className="h-6 w-6" />
          </div>
          <div className="metric-content">
            <h3>Reports Last Hour</h3>
            <p className="metric-value">{analyticsData.realTimeMetrics.reportsLastHour}</p>
            <span className="metric-trend">Real-time</span>
          </div>
        </div>

        <div className="metric-card active">
          <div className="metric-icon">
            <Users className="h-6 w-6" />
          </div>
          <div className="metric-content">
            <h3>Active Users</h3>
            <p className="metric-value">{analyticsData.realTimeMetrics.activeUsers}</p>
            <span className="metric-trend">Online now</span>
          </div>
        </div>

        <div className="metric-card pending">
          <div className="metric-icon">
            <Clock className="h-6 w-6" />
          </div>
          <div className="metric-content">
            <h3>Pending Reports</h3>
            <p className="metric-value">{analyticsData.realTimeMetrics.pendingReports}</p>
            <span className="metric-trend">Awaiting review</span>
          </div>
        </div>

        <div className="metric-card urgent-reports">
          <div className="metric-icon">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="metric-content">
            <h3>Urgent Reports</h3>
            <p className="metric-value">{analyticsData.realTimeMetrics.urgentReports}</p>
            <span className="metric-trend">High priority</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Category Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Reports by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.reportsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.reportsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="chart-container">
          <h3 className="chart-title">Reports by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.reportsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Trends */}
        <div className="chart-container full-width">
          <h3 className="chart-title">Daily Report Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trendAnalytics.daily.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Location Heatmap */}
        <div className="chart-container">
          <h3 className="chart-title">Top Locations</h3>
          <div className="location-list">
            {analyticsData.reportsByLocation.slice(0, 5).map((location, index) => (
              <div key={index} className="location-item">
                <div className="location-info">
                  <MapPin className="h-4 w-4" />
                  <span>{location.city}, {location.state}</span>
                </div>
                <div className="location-count">{location.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-item">
          <FileText className="h-5 w-5" />
          <div>
            <span className="stat-label">Total Reports</span>
            <span className="stat-value">{analyticsData.totalReports}</span>
          </div>
        </div>
        <div className="stat-item">
          <TrendingUp className="h-5 w-5" />
          <div>
            <span className="stat-label">This Month</span>
            <span className="stat-value">{analyticsData.reportsThisMonth}</span>
          </div>
        </div>
        <div className="stat-item">
          <Eye className="h-5 w-5" />
          <div>
            <span className="stat-label">Avg Response Time</span>
            <span className="stat-value">{Math.round(analyticsData.realTimeMetrics.averageResponseTime / 3600)}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
