import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { reportsApi } from '../../services/api';
import '../../styles/report-submission.css';
import {
  AlertTriangle,
  Upload,
  FileText,
  Calendar,
  Shield,
  Camera,
  X,
  Map,
} from 'lucide-react';
import MapPicker from '../../components/ui/MapPicker';
import FormField from '../../components/ui/FormField';
import DateTimePicker from '../../components/ui/DateTimePicker';
import Select from '../../components/ui/Select';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import { ReportCategory } from '../../types';

interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface ReportForm {
  title: string;
  description: string;
  category: ReportCategory;
  incidentDate: string;
  incidentTime: string;
  location: Location;
  isAnonymous: boolean;
  media?: File[];
}

const ReportSubmission: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [currentStep, setCurrentStep] = useState('basic');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReportForm>();

  const watchedCategory = watch('category');
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');

  // Form steps configuration
  const formSteps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Report title, category, and description'
    },
    {
      id: 'datetime',
      title: 'When & Where',
      description: 'Date, time, and location details'
    },
    {
      id: 'evidence',
      title: 'Evidence',
      description: 'Upload supporting documents or media',
      optional: true
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your report before submission'
    }
  ];

  const categoryOptions = [
    { value: 'bribery', label: 'Bribery', description: 'Offering, giving, receiving, or soliciting bribes' },
    { value: 'embezzlement', label: 'Embezzlement', description: 'Theft or misappropriation of funds' },
    { value: 'fraud', label: 'Fraud', description: 'Intentional deception for financial gain' },
    { value: 'abuse_of_power', label: 'Abuse of Power', description: 'Misuse of authority or position' },
    { value: 'nepotism', label: 'Nepotism', description: 'Favoritism based on relationships' },
    { value: 'kickbacks', label: 'Kickbacks', description: 'Secret payments made in return for facilitating transactions' },
    { value: 'other', label: 'Other', description: 'Other forms of corruption' }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setSelectedLocation({ lat, lng, address });
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (!canProceedToNextStep()) {
      setError('Please fill in all required fields before proceeding');
      return;
    }
    setError('');

    const currentIndex = formSteps.findIndex(step => step.id === currentStep);
    if (currentIndex < formSteps.length - 1) {
      const nextStep = formSteps[currentIndex + 1].id;
      setCurrentStep(nextStep);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = formSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      const previousStep = formSteps[currentIndex - 1];
      setCurrentStep(previousStep.id);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'basic':
        return !!watchedTitle?.trim() && !!watchedDescription?.trim() && !!watchedCategory;
      case 'datetime':
        const date = watch('incidentDate');
        const location = selectedLocation;
        return !!date && !!location;
      case 'evidence':
        // Evidence is optional
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const onSubmit = async (data: ReportForm) => {
    try {
      setIsLoading(true);
      setError('');

      const formData = {
        ...data,
        isAnonymous,
        media: selectedFiles
      };

      const response = await reportsApi.createReport(formData);

      if (response.success) {
        window.location.href = '/profile/reports';
      } else {
        setError(response.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="modern-form">
        {/* Header */}
        <div className="form-header">
          <div className="form-header-icon">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="form-title">Submit Corruption Report</h1>
          <p className="form-subtitle">
            Your report will be reviewed by law enforcement officials. All information is treated confidentially and securely.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator-wrapper">
          <ProgressIndicator
            steps={formSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Form */}
        <form id="report-form" onSubmit={handleSubmit(onSubmit)} className="form-body">
          {error && (
            <div className="info-box info-box-danger mt-4">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Anonymous Reporting Toggle */}
          <div className="form-section">
            <div className="info-box info-box-blue">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-3 flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    Submit this report anonymously
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Anonymous reports help protect your identity but may limit follow-up communication.
              </p>
            </div>
          </div>

          {/* Basic Information Section */}
          {currentStep === 'basic' && (
            <div className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </h2>
                <p className="form-section-description">
                  Provide the essential details about the corruption incident you want to report.
                </p>
              </div>

              <div className="form-grid">
                <FormField
                  label="Report Title"
                  required
                  error={errors.title?.message}
                  hint="Provide a clear, concise title that summarizes the incident"
                >
                  <input
                    {...register('title', {
                      required: 'Report title is required',
                      minLength: {
                        value: 10,
                        message: 'Title must be at least 10 characters'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Title must be less than 100 characters'
                      }
                    })}
                    type="text"
                    placeholder="Brief description of the corruption incident"
                  />
                </FormField>

                <FormField
                  label="Category"
                  required
                  error={errors.category?.message}
                  hint="Select the category that best describes the type of corruption"
                >
                  <Select
                    {...register('category', { required: 'Category is required' })}
                    options={categoryOptions}
                    placeholder="Select a category"
                    value={watchedCategory}
                    onChange={(value) => setValue('category', value as ReportCategory)}
                    searchable
                  />
                </FormField>

                <FormField
                  label="Detailed Description"
                  required
                  error={errors.description?.message}
                  hint="Provide comprehensive details including who, what, when, where, and how"
                  className="col-span-full"
                >
                  <textarea
                    {...register('description', {
                      required: 'Description is required',
                      minLength: {
                        value: 50,
                        message: 'Description must be at least 50 characters'
                      },
                      maxLength: {
                        value: 2000,
                        message: 'Description must be less than 2000 characters'
                      }
                    })}
                    rows={6}
                    placeholder="Provide detailed information about the incident including who, what, when, where, and how..."
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Date & Time Section */}
          {currentStep === 'datetime' && (
            <div className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">
                  <Calendar className="h-5 w-5" />
                  When & Where
                </h2>
                <p className="form-section-description">
                  Specify when and where the corruption incident occurred to help with investigation.
                </p>
              </div>

              <div className="form-grid form-grid-2">
                <FormField
                  label="Incident Date"
                  required
                  error={errors.incidentDate?.message}
                  hint="When did the incident occur?"
                >
                  <DateTimePicker
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    min="2020-01-01"
                    value={watch('incidentDate') || ''}
                    onChange={(value) => setValue('incidentDate', value)}
                  />
                </FormField>

                <FormField
                  label="Incident Time"
                  error={errors.incidentTime?.message}
                  hint="Approximate time when the incident occurred (optional)"
                >
                  <DateTimePicker
                    type="time"
                    min="00:00"
                    max="23:59"
                    value={watch('incidentTime') || ''}
                    onChange={(value) => setValue('incidentTime', value)}
                  />
                </FormField>
              </div>

              <div className="form-grid form-grid-2">
                <FormField
                  label="Address"
                  required
                  error={errors.location?.address?.message}
                  hint="Street address where the incident occurred"
                >
                  <input
                    {...register('location.address', {
                      required: 'Address is required'
                    })}
                    type="text"
                    placeholder="Street address"
                  />
                </FormField>

                <FormField
                  label="City"
                  required
                  error={errors.location?.city?.message}
                >
                  <input
                    {...register('location.city', {
                      required: 'City is required'
                    })}
                    type="text"
                    placeholder="City"
                  />
                </FormField>

                <FormField
                  label="State/Province"
                  required
                  error={errors.location?.state?.message}
                >
                  <input
                    {...register('location.state', {
                      required: 'State is required'
                    })}
                    type="text"
                    placeholder="State or Province"
                  />
                </FormField>

                <FormField
                  label="Country"
                  required
                  error={errors.location?.country?.message}
                >
                  <input
                    {...register('location.country', {
                      required: 'Country is required'
                    })}
                    type="text"
                    placeholder="Country"
                  />
                </FormField>
              </div>

              <FormField
                label="Precise Location (Optional)"
                hint="Click on the map to pinpoint the exact location"
                className="col-span-full"
              >
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="btn btn-secondary"
                  >
                    <Map className="h-4 w-4" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>

                  {showMap && (
                    <div className="map-container">
                      <p className="text-sm text-gray-600 mb-3">
                        Click on the map to pinpoint the exact location where the incident occurred.
                        This helps authorities respond more effectively.
                      </p>
                      <MapPicker
                        onLocationSelect={handleLocationSelect}
                        height="400px"
                      />
                      {selectedLocation && (
                        <div className="info-box info-box-blue mt-3">
                          <p className="text-sm font-medium text-blue-900">Selected Location:</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          </p>
                          {selectedLocation.address && (
                            <p className="text-xs text-blue-700 mt-1">
                              Address: {selectedLocation.address}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          )}

          {/* Evidence Section */}
          {currentStep === 'evidence' && (
            <div className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">
                  <Camera className="h-5 w-5" />
                  Supporting Evidence
                </h2>
                <p className="form-section-description">
                  Upload any documents, photos, videos, or other evidence that supports your report. This step is optional but can strengthen your case.
                </p>
              </div>

              <FormField
                label="Upload Files"
                hint="Accepted formats: Images (JPG, PNG), Videos (MP4, MOV), Documents (PDF). Max file size: 10MB each."
                className="col-span-full"
              >
                <div className="file-upload-zone">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <label
                      htmlFor="file-upload"
                      className="btn btn-primary"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-gray-500">
                      or drag and drop files here
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Maximum 10MB per file. Supported formats: JPG, PNG, MP4, MOV, PDF
                  </p>
                </div>
              </FormField>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <Camera className="h-5 w-5 text-blue-500" />
                            ) : file.type.startsWith('video/') ? (
                              <FileText className="h-5 w-5 text-green-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Section */}
          {currentStep === 'review' && (
            <div className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">
                  <Shield className="h-5 w-5" />
                  Review Your Report
                </h2>
                <p className="form-section-description">
                  Please review all the information below before submitting your report. Make sure all details are accurate.
                </p>
              </div>

              <div className="space-y-6">
                {/* Basic Information Review */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Title:</span>
                      <p className="text-sm text-gray-900">{watchedTitle || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Category:</span>
                      <p className="text-sm text-gray-900">
                        {categoryOptions.find(opt => opt.value === watchedCategory)?.label || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-900 mt-1">{watchedDescription || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Anonymous Reporting */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Reporting Method</h3>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-900">
                      {isAnonymous ? 'Anonymous Report' : 'Identified Report'}
                    </span>
                  </div>
                </div>

                {/* Evidence Review */}
                {selectedFiles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Supporting Evidence</h3>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <Camera className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{file.name}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Your report will be reviewed by law enforcement officials</li>
                          <li>All information is treated confidentially according to applicable laws</li>
                          <li>False reports may result in legal consequences</li>
                          <li>You may be contacted for additional information if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Form Footer with Navigation */}
        <div className="form-footer">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            {currentStep !== 'basic' && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="btn btn-secondary"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentStep !== 'review' ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                disabled={!canProceedToNextStep()}
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                form="report-form"
                disabled={isLoading}
                className={`btn btn-danger btn-lg ${isLoading ? 'btn-loading' : ''}`}
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSubmission;
