import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Search, TrendingUp } from 'lucide-react';
import ReportPost from './ReportPost';
import { reportsApi } from '../../services/api';

interface TimelineFeedProps {
  className?: string;
}

const TimelineFeed: React.FC<TimelineFeedProps> = ({ className = '' }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  });

  const loadReports = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 DEBUGGING: Loading reports for timeline feed...');
      
      const response = await reportsApi.getReports(filters, pageNum, 10);
      
      console.log('🔍 DEBUGGING: Timeline feed response:', response);

      if (response.success && response.data) {
        const newReports = response.data.reports || [];
        
        if (pageNum === 1 || isRefresh) {
          setReports(newReports);
        } else {
          setReports(prev => [...prev, ...newReports]);
        }

        setHasMore(newReports.length === 10);
        setPage(pageNum);
        setError(null);
      } else {
        setError(response.error || 'Failed to load reports');
      }
    } catch (err) {
      console.error('❌ DEBUGGING: Timeline feed error:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports(1);
  }, [filters]);

  const handleRefresh = () => {
    loadReports(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReports(page + 1);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReportView = (reportId: string) => {
    console.log('View report:', reportId);
    // TODO: Navigate to report details or open modal
  };

  const handleReportShare = (reportId: string) => {
    console.log('Share report:', reportId);
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Anti-Corruption Report',
        text: 'Check out this corruption report',
        url: `${window.location.origin}/reports/${reportId}`
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/reports/${reportId}`);
      alert('Report link copied to clipboard!');
    }
  };

  const handleReportLike = (reportId: string) => {
    console.log('Like report:', reportId);
    // TODO: Implement like functionality
    // Update local state optimistically
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, liked: !report.liked }
        : report
    ));
  };

  if (loading && reports.length === 0) {
    return (
      <div className={`timeline-feed ${className}`}>
        <div className="timeline-header">
          <h2 className="timeline-title">
            <TrendingUp className="h-5 w-5" />
            Reports Timeline
          </h2>
        </div>
        <div className="timeline-loading">
          <div className="loading-spinner">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className={`timeline-feed ${className}`}>
        <div className="timeline-header">
          <h2 className="timeline-title">
            <TrendingUp className="h-5 w-5" />
            Reports Timeline
          </h2>
        </div>
        <div className="timeline-error">
          <p>Error: {error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`timeline-feed ${className}`}>
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-title-section">
          <h2 className="timeline-title">
            <TrendingUp className="h-5 w-5" />
            Reports Timeline
          </h2>
          <p className="timeline-subtitle">
            Latest corruption reports from the community
          </p>
        </div>
        
        <div className="timeline-actions">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="timeline-filters">
        <div className="filter-group">
          <div className="search-filter">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          
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
      </div>

      {/* Timeline Content */}
      <div className="timeline-content">
        {reports.length === 0 ? (
          <div className="timeline-empty">
            <TrendingUp className="h-12 w-12 text-gray-400" />
            <h3>No reports found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            {reports.map((report) => (
              <ReportPost
                key={report.id}
                report={report}
                onView={handleReportView}
                onShare={handleReportShare}
                onLike={handleReportLike}
              />
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="timeline-load-more">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="load-more-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Reports'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TimelineFeed;
