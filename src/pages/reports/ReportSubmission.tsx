import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reportsApi } from '../../services/api';
import {
  AlertTriangle,
  Upload,
  X,
  MapPin,
  FileText,
  Camera,
  Shield,
  Map
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MapPicker from '../../components/ui/MapPicker';

// Define types locally to avoid import issues
enum ReportCategory {
  BRIBERY = 'bribery',
  EMBEZZLEMENT = 'embezzlement',
  FRAUD = 'fraud',
  ABUSE_OF_POWER = 'abuse_of_power',
  NEPOTISM = 'nepotism',
  OTHER = 'other'
}

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

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ReportForm>();

  const watchedCategory = watch('category');

  const categoryOptions = [
    { value: ReportCategory.BRIBERY, label: 'Bribery', description: 'Offering, giving, receiving, or soliciting bribes' },
    { value: ReportCategory.EMBEZZLEMENT, label: 'Embezzlement', description: 'Theft or misappropriation of funds' },
    { value: ReportCategory.FRAUD, label: 'Fraud', description: 'Intentional deception for financial gain' },
    { value: ReportCategory.ABUSE_OF_POWER, label: 'Abuse of Power', description: 'Misuse of authority or position' },
    { value: ReportCategory.NEPOTISM, label: 'Nepotism', description: 'Favoritism based on relationships' },
    { value: ReportCategory.OTHER, label: 'Other', description: 'Other forms of corruption' }
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
        navigate('/profile/reports', {
          state: { message: 'Report submitted successfully!' }
        });
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
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Submit Corruption Report</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Your report will be reviewed by law enforcement officials. All information is treated confidentially.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Anonymous Reporting Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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

          {/* Report Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Report Title *
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the corruption incident"
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {watchedCategory && (
              <p className="mt-1 text-xs text-gray-600">
                {categoryOptions.find(opt => opt.value === watchedCategory)?.description}
              </p>
            )}
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Detailed Description *
            </label>
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide detailed information about the incident including who, what, when, where, and how..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('location.address', {
                    required: 'Address is required'
                  })}
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address where incident occurred"
                />
              </div>
              {errors.location?.address && (
                <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                {...register('location.city', {
                  required: 'City is required'
                })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
              {errors.location?.city && (
                <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State/Province *
              </label>
              <input
                {...register('location.state', {
                  required: 'State is required'
                })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="State or Province"
              />
              {errors.location?.state && (
                <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                {...register('location.country', {
                  required: 'Country is required'
                })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Country"
              />
              {errors.location?.country && (
                <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>
              )}
            </div>
          </div>

          {/* Interactive Map */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                📍 Incident Location (Interactive Map)
              </label>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Map className="h-4 w-4 mr-1" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>

            {showMap && (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Click on the map to pinpoint the exact location where the incident occurred.
                  This helps authorities respond more effectively.
                </p>
                <MapPicker
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />
                {selectedLocation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
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

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supporting Evidence (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Images, videos, or PDF files up to 10MB each
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Submitting...</span>
                </div>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportSubmission;
