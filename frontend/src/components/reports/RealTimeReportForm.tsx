import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { io, Socket } from 'socket.io-client';
import {
  Send,
  Upload,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Camera,
  FileText,
  Mic
} from 'lucide-react';

interface RealTimeReportFormProps {
  onSubmitSuccess?: (reportId: string) => void;
  onSubmitError?: (error: string) => void;
}

interface ReportFormData {
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
      lat: number;
      lng: number;
    };
  };
  urgencyLevel: number;
  isAnonymous: boolean;
  media?: FileList;
}

const RealTimeReportForm: React.FC<RealTimeReportFormProps> = ({
  onSubmitSuccess,
  onSubmitError
}) => {
  const [connected, setConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ReportFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      incidentDate: '',
      location: {
        address: '',
        city: '',
        state: '',
        country: 'India'
      },
      urgencyLevel: 5,
      isAnonymous: false
    }
  });

  const watchedUrgency = watch('urgencyLevel');

  useEffect(() => {
    initializeRealTimeConnection();
    getCurrentLocation();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeRealTimeConnection = () => {
    console.log('🔌 Initializing real-time report submission...');
    
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to real-time reporting');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from real-time reporting');
      setConnected(false);
    });

    socketRef.current.on('report:submit:progress', (data: { progress: number }) => {
      setUploadProgress(data.progress);
    });

    socketRef.current.on('report:submit:success', (data: { reportId: string }) => {
      console.log('✅ Report submitted successfully:', data.reportId);
      setSubmitting(false);
      setUploadProgress(0);
      reset();
      setPreviewFiles([]);
      onSubmitSuccess?.(data.reportId);
    });

    socketRef.current.on('report:submit:error', (data: { error: string }) => {
      console.error('❌ Report submission failed:', data.error);
      setSubmitting(false);
      setUploadProgress(0);
      onSubmitError?.(data.error);
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          // Reverse geocoding could be implemented here
          console.log('📍 Current location obtained:', position.coords);
        },
        (error) => {
          console.warn('Failed to get current location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPreviewFiles(files);
  };

  const removeFile = (index: number) => {
    const newFiles = previewFiles.filter((_, i) => i !== index);
    setPreviewFiles(newFiles);
    
    // Update file input
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      newFiles.forEach(file => dt.items.add(file));
      fileInputRef.current.files = dt.files;
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!connected) {
      onSubmitError?.('Not connected to real-time service. Please check your connection.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      // Prepare form data
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('incidentDate', data.incidentDate);
      formData.append('urgencyLevel', data.urgencyLevel.toString());
      formData.append('isAnonymous', data.isAnonymous.toString());
      
      // Add location data
      formData.append('location.address', data.location.address);
      formData.append('location.city', data.location.city);
      formData.append('location.state', data.location.state);
      formData.append('location.country', data.location.country);
      
      // Add coordinates if available
      if (currentLocation) {
        formData.append('location.coordinates.lat', currentLocation.coords.latitude.toString());
        formData.append('location.coordinates.lng', currentLocation.coords.longitude.toString());
      }
      
      // Add files
      previewFiles.forEach((file, index) => {
        formData.append('media', file);
      });

      // Submit via traditional API (WebSocket for progress updates)
      const response = await fetch('http://localhost:5000/api/reports/anonymous', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Emit real-time notification
        socketRef.current?.emit('report:submit', {
          id: result.data.report.id,
          title: data.title,
          category: data.category,
          location: data.location,
          urgencyLevel: data.urgencyLevel,
          isAnonymous: data.isAnonymous,
          timestamp: new Date()
        });

        onSubmitSuccess?.(result.data.report.id);
        reset();
        setPreviewFiles([]);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      onSubmitError?.(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setSubmitting(false);
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
    <div className="real-time-report-form">
      {/* Connection Status */}
      <div className="connection-banner">
        <div className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span>{connected ? 'Real-time reporting active' : 'Offline mode'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="report-form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">
            Report Title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="Brief description of the incident"
          />
          {errors.title && <span className="error-message">{errors.title.message}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">
            Detailed Description *
          </label>
          <textarea
            {...register('description', { 
              required: 'Description is required',
              minLength: { value: 50, message: 'Description must be at least 50 characters' }
            })}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            rows={4}
            placeholder="Provide detailed information about the incident..."
          />
          {errors.description && <span className="error-message">{errors.description.message}</span>}
        </div>

        {/* Category and Date */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className={`form-select ${errors.category ? 'error' : ''}`}
            >
              <option value="">Select category</option>
              <option value="bribery">Bribery</option>
              <option value="fraud">Fraud</option>
              <option value="embezzlement">Embezzlement</option>
              <option value="abuse_of_power">Abuse of Power</option>
              <option value="nepotism">Nepotism</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <span className="error-message">{errors.category.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Incident Date *</label>
            <input
              {...register('incidentDate', { required: 'Incident date is required' })}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className={`form-input ${errors.incidentDate ? 'error' : ''}`}
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
            <input
              {...register('location.address', { required: 'Address is required' })}
              type="text"
              placeholder="Street address"
              className={`form-input ${errors.location?.address ? 'error' : ''}`}
            />
            <input
              {...register('location.city', { required: 'City is required' })}
              type="text"
              placeholder="City"
              className={`form-input ${errors.location?.city ? 'error' : ''}`}
            />
            <input
              {...register('location.state', { required: 'State is required' })}
              type="text"
              placeholder="State"
              className={`form-input ${errors.location?.state ? 'error' : ''}`}
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
            Urgency Level: <span className={`urgency-badge ${getUrgencyColor(watchedUrgency)}`}>
              {getUrgencyLabel(watchedUrgency)}
            </span>
          </label>
          <input
            {...register('urgencyLevel')}
            type="range"
            min="1"
            max="10"
            className="urgency-slider"
          />
          <div className="urgency-scale">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label className="form-label">
            <Upload className="h-4 w-4" />
            Evidence Files
          </label>
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="file-input"
            />
            <div className="upload-prompt">
              <Camera className="h-8 w-8 text-gray-400" />
              <p>Click to upload or drag files here</p>
              <span>Images, videos, documents (max 5 files)</span>
            </div>
          </div>
          
          {/* File Previews */}
          {previewFiles.length > 0 && (
            <div className="file-previews">
              {previewFiles.map((file, index) => (
                <div key={index} className="file-preview">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous Option */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              {...register('isAnonymous')}
              type="checkbox"
              className="checkbox"
            />
            <span>Submit anonymously</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          {submitting && uploadProgress > 0 && (
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
            disabled={submitting || !connected}
            className="submit-btn"
          >
            {submitting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealTimeReportForm;
