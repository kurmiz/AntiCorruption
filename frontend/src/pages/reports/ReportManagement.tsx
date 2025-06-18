import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EnhancedReportForm from '../../components/forms/EnhancedReportForm';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Download,
  Share2
} from 'lucide-react';
import '../../styles/enhanced-report-form.css';
import '../../styles/report-management.css';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgencyLevel: number;
  incidentDate: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  isAnonymous: boolean;
  evidence: any[];
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

const ReportManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0
  });

  useEffect(() => {
    fetchReports();
  }, [filters, pagination.currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`http://localhost:5001/api/reports/my-reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports);
        setPagination(result.data.pagination);
      } else {
        setError(result.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setShowForm(true);
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        // Show success message
      } else {
        setError(result.message || 'Failed to delete report');
      }
    } catch (err) {
      setError('Failed to delete report');
      console.error('Delete report error:', err);
    }
  };

  const handleFormSuccess = (reportId: string) => {
    setShowForm(false);
    setEditingReport(null);
    fetchReports(); // Refresh the list
    // Show success message
  };

  const handleFormError = (error: string) => {
    setError(error);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (showForm) {
    return (
      <div className="report-management">
        <div className="page-header">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingReport(null);
            }}
            className="back-btn"
          >
            ← Back to Reports
          </button>
          <h1>{editingReport ? 'Edit Report' : 'Submit New Report'}</h1>
        </div>

        <EnhancedReportForm
          editMode={!!editingReport}
          initialData={editingReport || undefined}
          reportId={editingReport?.id}
          onSubmitSuccess={handleFormSuccess}
          onSubmitError={handleFormError}
        />
      </div>
    );
  }

  return (
    <div className="report-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FileText className="h-6 w-6" />
            My Reports
          </h1>
          <p className="page-subtitle">
            Manage and track your corruption reports
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="primary-btn"
        >
          <Plus className="h-4 w-4" />
          Submit New Report
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <AlertTriangle className="h-5 w-5" />
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
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
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <FileText className="h-12 w-12 text-gray-400" />
          <h3>No reports found</h3>
          <p>You haven't submitted any reports yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="primary-btn"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Report
          </button>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-status">
                  {getStatusIcon(report.status)}
                  <span className="status-text">{report.status.replace('_', ' ')}</span>
                </div>
                <div className="report-actions">
                  {report.canEdit && (
                    <button
                      onClick={() => handleEdit(report)}
                      className="action-btn edit"
                      title="Edit report"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {report.canDelete && (
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="action-btn delete"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button className="action-btn more">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="report-content">
                <h3 className="report-title">{report.title}</h3>
                <p className="report-description">
                  {report.description.length > 150
                    ? `${report.description.substring(0, 150)}...`
                    : report.description
                  }
                </p>

                <div className="report-meta">
                  <div className="meta-item">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(report.incidentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin className="h-4 w-4" />
                    <span>{report.location.city}, {report.location.state}</span>
                  </div>
                  {report.evidence.length > 0 && (
                    <div className="meta-item">
                      <FileText className="h-4 w-4" />
                      <span>{report.evidence.length} file(s)</span>
                    </div>
                  )}
                </div>

                <div className="report-tags">
                  <span className="category-tag">{report.category}</span>
                  <span className={`priority-tag ${getPriorityColor(report.priority)}`}>
                    {report.priority}
                  </span>
                  {report.isAnonymous && (
                    <span className="anonymous-tag">Anonymous</span>
                  )}
                </div>
              </div>

              <div className="report-footer">
                <span className="created-date">
                  Created {new Date(report.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to={`/reports/${report.id}`}
                  className="view-btn"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
