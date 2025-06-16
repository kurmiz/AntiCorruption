import React, { useState } from 'react';
import {
  User,
  Clock,
  MapPin,
  Eye,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Shield,
  AlertTriangle,
  FileText,
  Play,
  Download,
  ExternalLink,
  Heart,
  ThumbsUp
} from 'lucide-react';

interface ReportPostProps {
  report: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    incidentDate: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
    };
    isAnonymous: boolean;
    reporter?: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    evidence: Array<{
      type: 'document' | 'image' | 'video' | 'audio' | 'other';
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      uploadedAt: string;
      description?: string;
    }>;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
  };
  onView?: (reportId: string) => void;
  onShare?: (reportId: string) => void;
  onLike?: (reportId: string) => void;
}

const ReportPost: React.FC<ReportPostProps> = ({ report, onView, onShare, onLike }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      bribery: 'bg-red-100 text-red-800 border-red-200',
      fraud: 'bg-orange-100 text-orange-800 border-orange-200',
      embezzlement: 'bg-purple-100 text-purple-800 border-purple-200',
      abuse_of_power: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      nepotism: 'bg-blue-100 text-blue-800 border-blue-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_investigation: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const images = report.evidence.filter(item => item.type === 'image');
  const videos = report.evidence.filter(item => item.type === 'video');
  const documents = report.evidence.filter(item => item.type === 'document');

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) onLike(report.id);
  };

  const truncatedDescription = report.description.length > 200 
    ? report.description.substring(0, 200) + '...' 
    : report.description;

  return (
    <div className="report-post">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {report.isAnonymous ? (
              <div className="anonymous-avatar">
                <Shield className="h-5 w-5" />
              </div>
            ) : (
              <div className="user-avatar">
                {report.reporter?.avatar ? (
                  <img 
                    src={report.reporter.avatar} 
                    alt={`${report.reporter.firstName} ${report.reporter.lastName}`}
                    className="avatar-image"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            )}
          </div>
          
          <div className="author-info">
            <div className="author-name">
              {report.isAnonymous ? (
                <span className="anonymous-name">Anonymous Reporter</span>
              ) : (
                <span className="user-name">
                  {report.reporter?.firstName} {report.reporter?.lastName}
                </span>
              )}
            </div>
            <div className="post-meta">
              <span className="post-time">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(report.createdAt)}
              </span>
              <span className="post-location">
                <MapPin className="h-3 w-3" />
                {report.location.city}, {report.location.state}
              </span>
            </div>
          </div>
        </div>

        <div className="post-actions">
          <div className="post-badges">
            <span className={`category-badge ${getCategoryColor(report.category)}`}>
              {report.category.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`status-badge ${getStatusColor(report.status)}`}>
              {report.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button className="post-menu-btn">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">{report.title}</h3>
        
        <div className="post-description">
          <p>
            {showFullDescription ? report.description : truncatedDescription}
            {report.description.length > 200 && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="show-more-btn"
              >
                {showFullDescription ? ' Show less' : ' Show more'}
              </button>
            )}
          </p>
        </div>

        {/* Media Gallery */}
        {(images.length > 0 || videos.length > 0) && (
          <div className="media-gallery">
            {/* Images */}
            {images.length > 0 && (
              <div className={`image-grid ${images.length === 1 ? 'single' : images.length === 2 ? 'double' : 'multiple'}`}>
                {images.slice(0, 4).map((image, index) => (
                  <div 
                    key={index} 
                    className="image-container"
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img 
                      src={`http://localhost:5000${image.url}`}
                      alt={image.description || image.originalName}
                      className="gallery-image"
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="more-images-overlay">
                        <span>+{images.length - 4} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="video-gallery">
                {videos.map((video, index) => (
                  <div key={index} className="video-container">
                    <video 
                      src={`http://localhost:5000${video.url}`}
                      poster={`http://localhost:5000${video.url.replace(/\.[^/.]+$/, '')}_thumb.jpg`}
                      controls
                      className="gallery-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="video-overlay">
                      <Play className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div className="documents-section">
            <h4 className="documents-title">
              <FileText className="h-4 w-4" />
              Attached Documents ({documents.length})
            </h4>
            <div className="documents-list">
              {documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <div className="document-info">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="document-name">{doc.originalName}</p>
                      <p className="document-meta">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <div className="document-actions">
                    <button className="document-action-btn">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="document-action-btn">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Footer */}
      <div className="post-footer">
        <div className="post-stats">
          <span className="stat-item">
            <Eye className="h-4 w-4" />
            {report.viewCount} views
          </span>
        </div>

        <div className="post-interactions">
          <button 
            className={`interaction-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>Support</span>
          </button>
          
          <button className="interaction-btn" onClick={() => onView?.(report.id)}>
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </button>
          
          <button className="interaction-btn" onClick={() => onShare?.(report.id)}>
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div className="image-modal" onClick={() => setSelectedImageIndex(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img 
              src={`http://localhost:5000${images[selectedImageIndex].url}`}
              alt={images[selectedImageIndex].description || images[selectedImageIndex].originalName}
              className="modal-image"
            />
            <button 
              className="modal-close"
              onClick={() => setSelectedImageIndex(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPost;
