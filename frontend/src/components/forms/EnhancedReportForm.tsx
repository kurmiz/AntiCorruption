import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import {
  Upload,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Camera,
  Video,
  Paperclip,
  X,
  Send,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  Loader
} from 'lucide-react';

// Validation schema
const reportSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other']),
  incidentDate: yup
    .date()
    .required('Incident date is required')
    .max(new Date(), 'Incident date cannot be in the future'),
  location: yup.object({
    address: yup
      .string()
      .required('Address is required')
      .min(5, 'Address must be at least 5 characters'),
    city: yup
      .string()
      .required('City is required')
      .min(2, 'City must be at least 2 characters'),
    state: yup
      .string()
      .required('State is required')
      .min(2, 'State must be at least 2 characters'),
    country: yup.string().default('India')
  }),
  urgencyLevel: yup
    .number()
    .min(1, 'Urgency level must be between 1-10')
    .max(10, 'Urgency level must be between 1-10')
    .default(5),
  isAnonymous: yup.boolean().default(false),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'critical'])
    .default('medium')
});

interface ReportFormData {
  title: string;
  description: string;
  category: string;
  incidentDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  urgencyLevel: number;
  isAnonymous: boolean;
  priority: string;
}

interface EnhancedReportFormProps {
  onSubmitSuccess?: (reportId: string) => void;
  onSubmitError?: (error: string) => void;
  editMode?: boolean;
  initialData?: Partial<ReportFormData>;
  reportId?: string;
}

const EnhancedReportForm: React.FC<EnhancedReportFormProps> = ({
  onSubmitSuccess,
  onSubmitError,
  editMode = false,
  initialData,
  reportId
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [realTimeConnected, setRealTimeConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ReportFormData>({
    resolver: yupResolver(reportSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      incidentDate: initialData?.incidentDate || new Date(),
      location: {
        address: initialData?.location?.address || '',
        city: initialData?.location?.city || '',
        state: initialData?.location?.state || '',
        country: initialData?.location?.country || 'India'
      },
      urgencyLevel: initialData?.urgencyLevel || 5,
      isAnonymous: initialData?.isAnonymous || false,
      priority: initialData?.priority || 'medium'
    }
  });

  const watchedValues = watch();

  // Initialize real-time connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      setRealTimeConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setRealTimeConnected(false);
    });

    socketRef.current.on('report:submit:progress', (data: { progress: number }) => {
      setUploadProgress(data.progress);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation && !editMode) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          // You could reverse geocode here to fill address fields
        },
        (error) => {
          console.warn('Failed to get location:', error);
        }
      );
    }
  }, [editMode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const maxFiles = 5;
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (files.length + selectedFiles.length > maxFiles) {
      onSubmitError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        onSubmitError?.(` File ${file.name} is too large. Maximum size: 50MB`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'location') {
          Object.entries(value).forEach(([locKey, locValue]) => {
            formData.append(`location.${locKey}`, locValue);
          });
        } else if (key === 'incidentDate') {
          formData.append(key, value.toISOString().split('T')[0]);
        } else {
          formData.append(key, value.toString());
        }
      });

      // Add files
      files.forEach((file, index) => {
        formData.append('media', file);
      });

      // Add location coordinates if available
      if (currentLocation) {
        formData.append('location.coordinates.lat', currentLocation.coords.latitude.toString());
        formData.append('location.coordinates.lng', currentLocation.coords.longitude.toString());
      }

      const endpoint = editMode && reportId
        ? `http://localhost:5001/api/reports/${reportId}`
        : 'http://localhost:5001/api/reports/anonymous';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Emit real-time update
        if (socketRef.current && realTimeConnected) {
          socketRef.current.emit('report:submit', {
            id: result.data.report.id,
            title: data.title,
            category: data.category,
            urgencyLevel: data.urgencyLevel,
            isAnonymous: data.isAnonymous,
            action: editMode ? 'updated' : 'created'
          });
        }

        onSubmitSuccess?.(result.data.report.id);
        
        if (!editMode) {
          reset();
          setFiles([]);
        }
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      onSubmitError?.(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level >= 8) return 'text-red-600 bg-red-100';
    if (level >= 6) return 'text-orange-600 bg-orange-100';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUrgencyLabel = (level: number) => {
    if (level >= 8) return 'Critical';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="enhanced-report-form">
      {/* Real-time connection status */}
      <div className="connection-status">
        <div className={`status-indicator ${realTimeConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{realTimeConnected ? 'Real-time enabled' : 'Offline mode'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="report-form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">
            <FileText className="h-4 w-4" />
            Report Title *
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Brief, descriptive title of the incident"
              />
            )}
          />
          {errors.title && <span className="error-message">{errors.title.message}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">
            <FileText className="h-4 w-4" />
            Detailed Description *
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={6}
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Provide detailed information about the incident, including what happened, when, where, and who was involved..."
              />
            )}
          />
          <div className="char-count">
            {watchedValues.description?.length || 0} / 5000 characters
          </div>
          {errors.description && <span className="error-message">{errors.description.message}</span>}
        </div>

        {/* Category and Date */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select {...field} className={`form-select ${errors.category ? 'error' : ''}`}>
                  <option value="">Select category</option>
                  <option value="bribery">Bribery</option>
                  <option value="fraud">Fraud</option>
                  <option value="embezzlement">Embezzlement</option>
                  <option value="abuse_of_power">Abuse of Power</option>
                  <option value="nepotism">Nepotism</option>
                  <option value="other">Other</option>
                </select>
              )}
            />
            {errors.category && <span className="error-message">{errors.category.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar className="h-4 w-4" />
              Incident Date *
            </label>
            <Controller
              name="incidentDate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className={`form-input ${errors.incidentDate ? 'error' : ''}`}
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              )}
            />
            {errors.incidentDate && <span className="error-message">{errors.incidentDate.message}</span>}
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">
            <MapPin className="h-4 w-4" />
            Location Details *
          </label>
          <div className="location-grid">
            <Controller
              name="location.address"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Street address"
                  className={`form-input ${errors.location?.address ? 'error' : ''}`}
                />
              )}
            />
            <Controller
              name="location.city"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="City"
                  className={`form-input ${errors.location?.city ? 'error' : ''}`}
                />
              )}
            />
            <Controller
              name="location.state"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="State"
                  className={`form-input ${errors.location?.state ? 'error' : ''}`}
                />
              )}
            />
          </div>
          {currentLocation && (
            <div className="location-detected">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Current location detected</span>
            </div>
          )}
        </div>

        {/* Urgency Level */}
        <div className="form-group">
          <label className="form-label">
            <AlertTriangle className="h-4 w-4" />
            Urgency Level: 
            <span className={`urgency-badge ${getUrgencyColor(watchedValues.urgencyLevel || 5)}`}>
              {getUrgencyLabel(watchedValues.urgencyLevel || 5)}
            </span>
          </label>
          <Controller
            name="urgencyLevel"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="range"
                min="1"
                max="10"
                className="urgency-slider"
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
          <div className="urgency-scale">
            <span>Low (1)</span>
            <span>Medium (5)</span>
            <span>High (8)</span>
            <span>Critical (10)</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label className="form-label">
            <Upload className="h-4 w-4" />
            Evidence Files (Optional)
          </label>
          <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="file-input"
              style={{ display: 'none' }}
            />
            <div className="upload-prompt">
              <Camera className="h-8 w-8 text-gray-400" />
              <p>Click to upload evidence files</p>
              <span>Images, videos, documents (max 5 files, 50MB each)</span>
            </div>
          </div>
          
          {/* File Previews */}
          {files.length > 0 && (
            <div className="file-previews">
              {files.map((file, index) => (
                <div key={index} className="file-preview">
                  <div className="file-icon">
                    {file.type.startsWith('image/') && <Camera className="h-4 w-4" />}
                    {file.type.startsWith('video/') && <Video className="h-4 w-4" />}
                    {file.type.includes('pdf') && <FileText className="h-4 w-4" />}
                    {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.includes('pdf') && <Paperclip className="h-4 w-4" />}
                  </div>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous Option */}
        <div className="form-group">
          <label className="checkbox-label">
            <Controller
              name="isAnonymous"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={field.value}
                  className="checkbox"
                />
              )}
            />
            <div className="checkbox-content">
              <span className="checkbox-title">Submit anonymously</span>
              <span className="checkbox-description">
                Your identity will be protected, but you can still track your report
              </span>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{uploadProgress}% uploaded</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="submit-btn"
          >
            {isSubmitting || uploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                {editMode ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {editMode ? 'Update Report' : 'Submit Report'}
              </>
            )}
          </button>
          
          {showPreview && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="preview-btn"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnhancedReportForm;
