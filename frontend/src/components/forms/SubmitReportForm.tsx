import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  MapPin,
  Upload,
  AlertTriangle,
  Users,
  DollarSign,
  Building,
  Eye,
  EyeOff,
  Save,
  Send,
  CheckCircle,
  X,
  Camera,
  Video,
  Paperclip,
  Info,
  Shield,
  Clock
} from 'lucide-react';
import '../../styles/submit-report-form.css';

// Validation Schema
const submitReportSchema = yup.object({
  // Mandatory Fields
  title: yup
    .string()
    .required('Title is required')
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'extortion', 'other']),
  
  incidentDate: yup
    .date()
    .required('Incident date is required')
    .max(new Date(), 'Incident date cannot be in the future'),
  
  location: yup.object({
    address: yup.string().required('Address is required').min(5, 'Address too short'),
    city: yup.string().required('City is required').min(2, 'City too short'),
    state: yup.string().required('State is required').min(2, 'State too short'),
    country: yup.string().default('India')
  }),
  
  description: yup
    .string()
    .required('Description is required')
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  
  isAnonymous: yup.boolean().default(false),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
  
  // Optional Fields
  personsInvolved: yup.string().optional(),
  departmentInvolved: yup.string().optional(),
  monetaryValue: yup.number().min(0, 'Amount cannot be negative').optional(),
  witnesses: yup.string().optional(),
  contactInfo: yup.object({
    email: yup.string().email('Invalid email format').optional(),
    phone: yup.string().optional()
  }).optional(),
  previousComplaints: yup.boolean().default(false),
  urgencyLevel: yup.number().min(1).max(10).default(5)
});

interface SubmitReportFormData {
  title: string;
  category: string;
  incidentDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  description: string;
  isAnonymous: boolean;
  termsAccepted: boolean;
  personsInvolved?: string;
  departmentInvolved?: string;
  monetaryValue?: number;
  witnesses?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  previousComplaints?: boolean;
  urgencyLevel: number;
}

interface SubmitReportFormProps {
  onSuccess?: (reportId: string) => void;
  onError?: (error: string) => void;
  isDraft?: boolean;
  initialData?: Partial<SubmitReportFormData>;
}

const SubmitReportForm: React.FC<SubmitReportFormProps> = ({
  onSuccess,
  onError,
  isDraft = false,
  initialData
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<SubmitReportFormData>({
    resolver: yupResolver(submitReportSchema),
    defaultValues: {
      title: initialData?.title || '',
      category: initialData?.category || '',
      incidentDate: initialData?.incidentDate || new Date(),
      location: {
        address: initialData?.location?.address || '',
        city: initialData?.location?.city || '',
        state: initialData?.location?.state || '',
        country: initialData?.location?.country || 'India'
      },
      description: initialData?.description || '',
      isAnonymous: initialData?.isAnonymous || false,
      termsAccepted: initialData?.termsAccepted || false,
      personsInvolved: initialData?.personsInvolved || '',
      departmentInvolved: initialData?.departmentInvolved || '',
      monetaryValue: initialData?.monetaryValue || undefined,
      witnesses: initialData?.witnesses || '',
      contactInfo: {
        email: initialData?.contactInfo?.email || user?.email || '',
        phone: initialData?.contactInfo?.phone || ''
      },
      previousComplaints: initialData?.previousComplaints || false,
      urgencyLevel: initialData?.urgencyLevel || 5
    }
  });

  const watchedValues = watch();

  // Get current location
  useEffect(() => {
    if (navigator.geolocation && !initialData) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          // You could implement reverse geocoding here
        },
        (error) => {
          console.warn('Failed to get location:', error);
        }
      );
    }
  }, [initialData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const maxFiles = 5;
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (files.length + selectedFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        onError?.(`File ${file.name} is too large. Maximum size: 50MB`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SubmitReportFormData, saveAsDraft = false) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      
      // Add form fields
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('incidentDate', data.incidentDate.toISOString().split('T')[0]);
      formData.append('location.address', data.location.address);
      formData.append('location.city', data.location.city);
      formData.append('location.state', data.location.state);
      formData.append('location.country', data.location.country);
      formData.append('description', data.description);
      formData.append('isAnonymous', data.isAnonymous.toString());
      formData.append('termsAccepted', data.termsAccepted.toString());
      formData.append('urgencyLevel', data.urgencyLevel.toString());
      formData.append('isDraft', saveAsDraft.toString());

      // Optional fields
      if (data.personsInvolved) {
        formData.append('personsInvolved', data.personsInvolved);
      }
      if (data.departmentInvolved) {
        formData.append('departmentInvolved', data.departmentInvolved);
      }
      if (data.monetaryValue) {
        formData.append('monetaryValue', data.monetaryValue.toString());
      }
      if (data.witnesses) {
        formData.append('witnesses', data.witnesses);
      }
      if (data.previousComplaints) {
        formData.append('previousComplaints', data.previousComplaints.toString());
      }

      // Contact info (only if not anonymous)
      if (!data.isAnonymous && data.contactInfo) {
        if (data.contactInfo.email) {
          formData.append('contactInfo.email', data.contactInfo.email);
        }
        if (data.contactInfo.phone) {
          formData.append('contactInfo.phone', data.contactInfo.phone);
        }
      }

      // Add location coordinates if available
      if (currentLocation) {
        formData.append('location.coordinates.latitude', currentLocation.coords.latitude.toString());
        formData.append('location.coordinates.longitude', currentLocation.coords.longitude.toString());
      }

      // Add files
      files.forEach((file) => {
        formData.append('evidence', file);
      });

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result.data.report.id);
        
        if (!saveAsDraft) {
          reset();
          setFiles([]);
          navigate('/reports');
        }
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      onError?.(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveAsDraft = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const getUrgencyColor = (level: number) => {
    if (level >= 8) return 'text-red-600 bg-red-100 border-red-200';
    if (level >= 6) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getUrgencyLabel = (level: number) => {
    if (level >= 8) return 'Critical';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="submit-report-form">
      <div className="form-header">
        <h1 className="form-title">
          <Shield className="h-6 w-6" />
          Submit Corruption Report
        </h1>
        <p className="form-subtitle">
          Your report helps fight corruption and build a transparent society. All information is secure and confidential.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="report-form">
        {/* Progress Indicator */}
        <div className="form-progress">
          <div className="progress-steps">
            <div className="step active">
              <div className="step-number">1</div>
              <span>Basic Info</span>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <span>Details</span>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <span>Evidence</span>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <span>Review</span>
            </div>
          </div>
        </div>

        {/* Section 1: Mandatory Information */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <AlertTriangle className="h-5 w-5" />
              Mandatory Information
            </h2>
            <p className="section-subtitle">Required fields to submit your report</p>
          </div>

          <div className="form-grid">
            {/* Title */}
            <div className="form-group full-width">
              <label className="form-label">
                <FileText className="h-4 w-4" />
                Title of Incident *
                <span className="help-text">Brief, clear description of what happened</span>
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder="e.g., Bribery demand at government office"
                  />
                )}
              />
              {errors.title && <span className="error-message">{errors.title.message}</span>}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                Category of Corruption *
                <span className="help-text">Select the most appropriate category</span>
              </label>
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
                    <option value="extortion">Extortion</option>
                    <option value="other">Other</option>
                  </select>
                )}
              />
              {errors.category && <span className="error-message">{errors.category.message}</span>}
            </div>

            {/* Incident Date */}
            <div className="form-group">
              <label className="form-label">
                <Calendar className="h-4 w-4" />
                Date of Incident *
                <span className="help-text">When did this happen?</span>
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
              Location *
              <span className="help-text">Where did this incident occur?</span>
            </label>
            <div className="location-grid">
              <Controller
                name="location.address"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Street address, building name"
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
                <span>Current location detected and will be included</span>
              </div>
            )}
            {(errors.location?.address || errors.location?.city || errors.location?.state) && (
              <span className="error-message">All location fields are required</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label className="form-label">
              Detailed Description *
              <span className="help-text">Provide comprehensive details about the incident</span>
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={6}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Describe what happened, when, where, who was involved, what was said or done, and any other relevant details..."
                />
              )}
            />
            <div className="char-count">
              {watchedValues.description?.length || 0} / 5000 characters
            </div>
            {errors.description && <span className="error-message">{errors.description.message}</span>}
          </div>
        </div>

        {/* Section 2: Optional Information */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <Info className="h-5 w-5" />
              Additional Information
            </h2>
            <p className="section-subtitle">Optional details that help with investigation</p>
          </div>

          <div className="form-grid">
            {/* Persons Involved */}
            <div className="form-group">
              <label className="form-label">
                <Users className="h-4 w-4" />
                Names of Involved Persons
                <span className="help-text">Officials, suspects, or other parties</span>
              </label>
              <Controller
                name="personsInvolved"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="form-textarea"
                    placeholder="List names, positions, and roles of people involved..."
                  />
                )}
              />
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label">
                <Building className="h-4 w-4" />
                Department/Agency Involved
                <span className="help-text">Which government department or agency?</span>
              </label>
              <Controller
                name="departmentInvolved"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select">
                    <option value="">Select department</option>
                    <option value="police">Police Department</option>
                    <option value="municipal">Municipal Corporation</option>
                    <option value="revenue">Revenue Department</option>
                    <option value="transport">Transport Department</option>
                    <option value="education">Education Department</option>
                    <option value="health">Health Department</option>
                    <option value="judiciary">Judiciary</option>
                    <option value="customs">Customs Department</option>
                    <option value="taxation">Taxation Department</option>
                    <option value="other">Other</option>
                  </select>
                )}
              />
            </div>

            {/* Monetary Amount */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign className="h-4 w-4" />
                Monetary Amount Involved
                <span className="help-text">Bribe amount or financial loss (in INR)</span>
              </label>
              <Controller
                name="monetaryValue"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </div>

            {/* Witnesses */}
            <div className="form-group">
              <label className="form-label">
                <Eye className="h-4 w-4" />
                Witnesses (if any)
                <span className="help-text">People who saw or know about the incident</span>
              </label>
              <Controller
                name="witnesses"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="form-textarea"
                    placeholder="Names and contact information of witnesses..."
                  />
                )}
              />
            </div>
          </div>

          {/* Previous Complaints */}
          <div className="form-group">
            <label className="checkbox-label">
              <Controller
                name="previousComplaints"
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
                <span className="checkbox-title">Previous Complaints</span>
                <span className="checkbox-description">
                  Have you reported this incident before to any authority?
                </span>
              </div>
            </label>
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
        </div>

        {/* Section 3: Evidence Upload */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <Upload className="h-5 w-5" />
              Evidence Files
            </h2>
            <p className="section-subtitle">Upload supporting documents, images, or videos</p>
          </div>

          <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
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

        {/* Section 4: Contact Information & Privacy */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <Shield className="h-5 w-5" />
              Privacy & Contact
            </h2>
            <p className="section-subtitle">Choose how you want to be contacted</p>
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
                <span className="checkbox-title">Submit Anonymously</span>
                <span className="checkbox-description">
                  Your identity will be protected. You can still track your report with a unique ID.
                </span>
              </div>
            </label>
          </div>

          {/* Contact Information (only if not anonymous) */}
          {!watchedValues.isAnonymous && (
            <div className="contact-section">
              <h3 className="subsection-title">Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Email Address
                    <span className="help-text">For updates and follow-up</span>
                  </label>
                  <Controller
                    name="contactInfo.email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className="form-input"
                        placeholder="your.email@example.com"
                      />
                    )}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number
                    <span className="help-text">Optional, for urgent matters</span>
                  </label>
                  <Controller
                    name="contactInfo.phone"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="tel"
                        className="form-input"
                        placeholder="+91 9876543210"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="form-group">
            <label className="checkbox-label">
              <Controller
                name="termsAccepted"
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
                <span className="checkbox-title">Accept Terms and Conditions *</span>
                <span className="checkbox-description">
                  I confirm that the information provided is true and accurate to the best of my knowledge.
                  I understand that providing false information is a punishable offense.
                </span>
              </div>
            </label>
            {errors.termsAccepted && <span className="error-message">{errors.termsAccepted.message}</span>}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span>Uploading... {uploadProgress}%</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isSubmitting || uploading}
            className="draft-btn"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </button>

          <button
            type="submit"
            disabled={isSubmitting || uploading || !watchedValues.termsAccepted}
            className="submit-btn"
          >
            {isSubmitting || uploading ? (
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

export default SubmitReportForm;
