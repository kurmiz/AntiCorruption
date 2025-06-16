import React from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Tag,
  AlertTriangle,
  Shield,
  DollarSign,
  Users,
  Paperclip
} from 'lucide-react';

interface ReportPreviewProps {
  data: {
    title: string;
    description: string;
    category: string;
    incidentDate: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    isAnonymous: boolean;
    involvedParties?: Array<{
      name: string;
      role: string;
      organization?: string;
      position?: string;
      contactInfo?: string;
    }>;
    estimatedLoss?: number;
    currency?: string;
    urgencyLevel?: number;
    tags?: string[];
    media?: File[];
  };
  onEdit: (step: string) => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ data, onEdit }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'bribery': 'Bribery',
      'fraud': 'Fraud',
      'embezzlement': 'Embezzlement',
      'abuse_of_power': 'Abuse of Power',
      'nepotism': 'Nepotism',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  };

  const getUrgencyLabel = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Medium';
    if (level <= 8) return 'High';
    return 'Critical';
  };

  const getUrgencyColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100';
    if (level <= 6) return 'text-yellow-600 bg-yellow-100';
    if (level <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="report-preview">
      <div className="preview-header">
        <h3 className="preview-title">
          <FileText className="h-5 w-5" />
          Report Preview
        </h3>
        <p className="preview-subtitle">
          Please review your report details before submission
        </p>
      </div>

      <div className="preview-content">
        {/* Basic Information */}
        <div className="preview-section">
          <div className="section-header">
            <h4 className="section-title">Basic Information</h4>
            <button 
              type="button" 
              onClick={() => onEdit('basic')} 
              className="edit-btn"
            >
              Edit
            </button>
          </div>
          
          <div className="preview-field">
            <label className="field-label">
              <FileText className="h-4 w-4" />
              Title
            </label>
            <p className="field-value">{data.title}</p>
          </div>

          <div className="preview-field">
            <label className="field-label">
              <Tag className="h-4 w-4" />
              Category
            </label>
            <span className="category-badge">
              {getCategoryLabel(data.category)}
            </span>
          </div>

          <div className="preview-field">
            <label className="field-label">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <p className="field-value description">{data.description}</p>
          </div>

          <div className="preview-field">
            <label className="field-label">
              <Shield className="h-4 w-4" />
              Submission Type
            </label>
            <span className={`submission-badge ${data.isAnonymous ? 'anonymous' : 'identified'}`}>
              {data.isAnonymous ? 'Anonymous' : 'Identified'}
            </span>
          </div>
        </div>

        {/* Date & Location */}
        <div className="preview-section">
          <div className="section-header">
            <h4 className="section-title">When & Where</h4>
            <button 
              type="button" 
              onClick={() => onEdit('datetime')} 
              className="edit-btn"
            >
              Edit
            </button>
          </div>

          <div className="preview-field">
            <label className="field-label">
              <Calendar className="h-4 w-4" />
              Incident Date
            </label>
            <p className="field-value">
              {formatDate(data.incidentDate)}
            </p>
          </div>

          <div className="preview-field">
            <label className="field-label">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <div className="location-details">
              <p className="field-value">{data.location.address}</p>
              <p className="field-value secondary">
                {data.location.city}, {data.location.state}, {data.location.country}
              </p>
              {data.location.coordinates && (
                <p className="field-value coordinates">
                  Coordinates: {data.location.coordinates.latitude.toFixed(6)}, {data.location.coordinates.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Details */}
        {(data.urgencyLevel || data.estimatedLoss || data.involvedParties?.length || data.tags?.length) && (
          <div className="preview-section">
            <div className="section-header">
              <h4 className="section-title">Additional Details</h4>
              <button 
                type="button" 
                onClick={() => onEdit('basic')} 
                className="edit-btn"
              >
                Edit
              </button>
            </div>

            {data.urgencyLevel && (
              <div className="preview-field">
                <label className="field-label">
                  <AlertTriangle className="h-4 w-4" />
                  Urgency Level
                </label>
                <span className={`urgency-badge ${getUrgencyColor(data.urgencyLevel)}`}>
                  {getUrgencyLabel(data.urgencyLevel)} ({data.urgencyLevel}/10)
                </span>
              </div>
            )}

            {data.estimatedLoss && (
              <div className="preview-field">
                <label className="field-label">
                  <DollarSign className="h-4 w-4" />
                  Estimated Loss
                </label>
                <p className="field-value">
                  {data.currency || 'INR'} {data.estimatedLoss.toLocaleString()}
                </p>
              </div>
            )}

            {data.involvedParties && data.involvedParties.length > 0 && (
              <div className="preview-field">
                <label className="field-label">
                  <Users className="h-4 w-4" />
                  Involved Parties ({data.involvedParties.length})
                </label>
                <div className="involved-parties">
                  {data.involvedParties.map((party, index) => (
                    <div key={index} className="party-item">
                      <p className="party-name">{party.name}</p>
                      <p className="party-details">
                        {party.role}
                        {party.organization && ` at ${party.organization}`}
                        {party.position && ` (${party.position})`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.tags && data.tags.length > 0 && (
              <div className="preview-field">
                <label className="field-label">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <div className="tags-list">
                  {data.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence */}
        {data.media && data.media.length > 0 && (
          <div className="preview-section">
            <div className="section-header">
              <h4 className="section-title">Evidence</h4>
              <button 
                type="button" 
                onClick={() => onEdit('evidence')} 
                className="edit-btn"
              >
                Edit
              </button>
            </div>

            <div className="preview-field">
              <label className="field-label">
                <Paperclip className="h-4 w-4" />
                Attached Files ({data.media.length})
              </label>
              <div className="media-list">
                {data.media.map((file, index) => (
                  <div key={index} className="media-item">
                    <div className="media-info">
                      <p className="media-name">{file.name}</p>
                      <p className="media-details">
                        {file.type} • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="preview-footer">
        <div className="warning-notice">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="warning-title">Important Notice</p>
            <p className="warning-text">
              Please ensure all information is accurate before submitting. 
              {data.isAnonymous 
                ? ' Anonymous reports cannot be edited after submission.' 
                : ' You can edit your report after submission if needed.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
