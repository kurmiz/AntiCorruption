import axios from 'axios';
import type { AxiosInstance } from 'axios'; // Import AxiosInstance as type
import type {
  User,
  Report,
  Message,
  MessageForm,
  Statistics,
  DashboardData,
  PaginatedResponse,
  ApiResponse as GlobalApiResponse, // Use a more specific ApiResponse or rename local one
  RegisterForm // Import RegisterForm
} from '../types'; // Import types as type-only

// Define basic types locally - consider using GlobalApiResponse from ../types
interface ApiResponse<T> { // This could be replaced by GlobalApiResponse
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Mock data storage (in a real app, this would be a database)
const mockUsers = [
  {
    id: '1',
    email: 'admin@anticorruption.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'police@anticorruption.com',
    password: 'police123',
    firstName: 'Dipesh',
    lastName: 'Kumapr',
    role: 'police',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'officer@anticorruption.com',
    password: 'officer123',
    firstName: 'Police',
    lastName: 'Officer',
    role: 'police',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'user@anticorruption.com',
    password: 'user123',
    firstName: 'John',
    lastName: 'Citizen',
    role: 'user',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    email: 'dipesh@anticorruption.com',
    password: 'dipesh123',
    firstName: 'Dipesh',
    lastName: 'Kumapr',
    role: 'police',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock delay to simulate network requests
const mockDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private api: AxiosInstance; // Changed type to AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api', // Point directly to backend server
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token'); // Use consistent token key
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token'); // Use consistent token key
          localStorage.removeItem('user'); // Also remove user data
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleRequest<T>(request: Promise<any>): Promise<GlobalApiResponse<T>> { // Ensure using GlobalApiResponse
    try {
      const axiosResponse = await request; // This is the AxiosResponse
      const backendResponseBody = axiosResponse.data; // This is the actual body string/object from the backend

      console.log('ApiService.handleRequest: Raw Axios response.data (backendResponseBody):', JSON.stringify(backendResponseBody, null, 2));

      // Check if backendResponseBody itself indicates success and contains the actual payload in a 'data' field
      if (backendResponseBody && typeof backendResponseBody.success === 'boolean') {
        // Handles structures like:
        // { success: true, data: ACTUAL_PAYLOAD, message?: "..." }
        // { success: false, message: "error msg", error?: "...", data?: problematic_data }
        console.log('ApiService.handleRequest: Backend response has a "success" flag.');
        return {
          success: backendResponseBody.success,
          // If success, data is T. If not, data might be error details or undefined.
          data: backendResponseBody.success ? (backendResponseBody.data as T) : (backendResponseBody.data as T | undefined),
          message: backendResponseBody.message,
          error: backendResponseBody.success ? undefined : (backendResponseBody.error || backendResponseBody.message)
        };
      } else if (axiosResponse.status >= 200 && axiosResponse.status < 300) {
        // If no 'success' flag in backendResponseBody, but HTTP status is success,
        // assume backendResponseBody IS the actual payload.
        console.log('ApiService.handleRequest: Backend response is direct payload (HTTP success, no wrapper).');
        return {
          success: true,
          data: backendResponseBody as T,
        };
      }
      
      // If HTTP status indicates error (but wasn't caught by catch), or structure is unexpected even with 2xx
      console.log('ApiService.handleRequest: Unexpected response structure or HTTP error not caught by catch block. Status:', axiosResponse.status);
      return {
        success: false,
        error: `Unexpected API response format. HTTP Status: ${axiosResponse.status}`,
        // data: backendResponseBody // Optionally include for debugging
      };

    } catch (error: any) {
      console.error('ApiService: Error in HTTP request execution:', error);
      const backendError = error.response?.data; // Error response body from backend
      return {
        success: false,
        error: backendError?.message || backendError?.error || error.message || 'An API error occurred during request execution.',
        data: backendError // Optionally include error data from backend
      };
    }
  }
}

// Real Authentication API
export const authApi = {
  login: async (credentials: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].post('/auth/login', credentials)
    );
  },

  register: async (userData: RegisterForm): Promise<GlobalApiResponse<any>> => { // Changed userData type to RegisterForm
    const apiService = new ApiService();
    // Send firstName and lastName directly to match enhanced backend
    const payload = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      phone: userData.phone, // Include phone if provided
    };
    return apiService['handleRequest'](
      apiService['api'].post('/auth/signup', payload)
    );
  },

  getCurrentUser: async (): Promise<GlobalApiResponse<User>> => {
    const apiService = new ApiService();
    console.log('Calling getCurrentUser API...');
    const response = await apiService['handleRequest']<User>(
      apiService['api'].get('/auth/me')
    );
    console.log('getCurrentUser API response:', JSON.stringify(response, null, 2));
    return response;
  },

  updateProfile: async (userData: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    console.log('authApi.updateProfile: Sending data:', userData);
    console.log('authApi.updateProfile: Current token:', localStorage.getItem('token'));

    const response = await apiService['handleRequest'](
      apiService['api'].put('/auth/profile', userData)
    );

    console.log('authApi.updateProfile: Response received:', response);
    return response;
  },

  updatePreferences: async (preferences: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put('/auth/preferences', preferences)
    );
  },

  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const apiService = new ApiService();
    console.log('authApi.updatePassword: Sending password update request');
    console.log('authApi.updatePassword: Current token:', localStorage.getItem('token'));

    const response = await apiService['handleRequest'](
      apiService['api'].put('/auth/password', passwordData)
    );

    console.log('authApi.updatePassword: Response received:', response);
    return response;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    await mockDelay(800); // Simulate network delay

    const user = mockUsers.find(u => u.email === email);
    if (user) {
      return {
        success: true,
        data: { message: 'Password reset email sent successfully' },
        message: 'Password reset email sent'
      };
    } else {
      return {
        success: false,
        error: 'No user found with this email address'
      };
    }
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
    await mockDelay(800); // Simulate network delay

    return {
      success: true,
      data: { message: 'Password reset successfully' },
      message: 'Password has been reset'
    };
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    // Clear localStorage
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');

    return {
      success: true,
      data: { message: 'Logged out successfully' },
      message: 'You have been logged out'
    };
  },
};

// Reports API
export const reportsApi = {
  getReports: async (filters?: any, page = 1, limit = 10): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();

    console.log('🔍 DEBUGGING: getReports called with filters:', filters, 'page:', page, 'limit:', limit);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    console.log('🔍 DEBUGGING: Making request to /reports/public');
    const response = await apiService['handleRequest'](
      apiService['api'].get(`/reports/public?${params}`)
    );

    console.log('🔍 DEBUGGING: getReports response:', response);
    return response;
  },

  getReport: async (id: string): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get(`/reports/${id}`)
    );
  },

  createReport: async (reportData: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();

    try {
      console.log('🔍 DEBUGGING: createReport - Starting report creation with data:', reportData);
      console.log('🔍 DEBUGGING: createReport - API base URL:', apiService['api'].defaults.baseURL);

      // Validate required fields before sending
      const validationErrors = [];
      if (!reportData.title || reportData.title.trim().length < 10) {
        validationErrors.push('Title must be at least 10 characters long');
      }
      if (!reportData.description || reportData.description.trim().length < 50) {
        validationErrors.push('Description must be at least 50 characters long');
      }
      if (!reportData.category) {
        validationErrors.push('Category is required');
      }
      if (!reportData.incidentDate) {
        validationErrors.push('Incident date is required');
      }
      if (!reportData.location || !reportData.location.address || !reportData.location.city || !reportData.location.state) {
        validationErrors.push('Complete location (address, city, state) is required');
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join('; ')
        };
      }

      const formData = new FormData();

      // Helper function to append nested objects with dot notation
      const appendToFormData = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldName = prefix ? `${prefix}.${key}` : key;

          if (key === 'media') {
            // Skip media, handle separately
            return;
          }

          if (value === undefined || value === null) {
            return;
          }

          if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob) && !Array.isArray(value)) {
            // Recursively handle nested objects
            appendToFormData(value, fieldName);
          } else if (Array.isArray(value)) {
            // Handle arrays
            value.forEach((item, index) => {
              if (typeof item === 'object' && !(item instanceof File) && !(item instanceof Blob)) {
                appendToFormData(item, `${fieldName}[${index}]`);
              } else {
                formData.append(`${fieldName}[${index}]`, item);
              }
            });
          } else {
            formData.append(fieldName, value as string | Blob);
          }
        });
      };

      // Append all fields using the helper function
      appendToFormData(reportData);

      // Append media files
      if (reportData.media && Array.isArray(reportData.media)) {
        reportData.media.forEach((file: File) => {
          formData.append('media', file);
        });
      }

      // Debug: Log FormData contents
      console.log('🔍 DEBUGGING: createReport - Sending FormData to backend');
      console.log('🔍 DEBUGGING: FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      console.log('🔍 DEBUGGING: Making POST request to /reports');
      const response = await apiService['handleRequest']<Report>(
        apiService['api'].post('/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );

      console.log('🔍 DEBUGGING: createReport - Backend response:', response);
      console.log('🔍 DEBUGGING: Response success:', response.success);
      console.log('🔍 DEBUGGING: Response data:', response.data);

      return response;

    } catch (error) {
      console.error('createReport: Error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create report'
      };
    }
  },

  updateReport: async (id: string, reportData: Partial<Report>): Promise<ApiResponse<Report>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put(`/reports/${id}`, reportData)
    );
  },

  deleteReport: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].delete(`/reports/${id}`)
    );
  },

  // Submit report (alias for createReport for backward compatibility)
  submitReport: async (reportData: any): Promise<ApiResponse<any>> => {
    return reportsApi.createReport(reportData);
  },

  // Submit anonymous report
  submitAnonymousReport: async (reportData: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();

    try {
      console.log('submitAnonymousReport: Starting anonymous report creation with data:', reportData);

      // Validate required fields before sending
      const validationErrors = [];
      if (!reportData.title || reportData.title.trim().length < 10) {
        validationErrors.push('Title must be at least 10 characters long');
      }
      if (!reportData.description || reportData.description.trim().length < 50) {
        validationErrors.push('Description must be at least 50 characters long');
      }
      if (!reportData.category) {
        validationErrors.push('Category is required');
      }
      if (!reportData.incidentDate) {
        validationErrors.push('Incident date is required');
      }
      if (!reportData.location || !reportData.location.address || !reportData.location.city || !reportData.location.state) {
        validationErrors.push('Complete location (address, city, state) is required');
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join('; ')
        };
      }

      const formData = new FormData();

      // Helper function to append nested objects with dot notation
      const appendToFormData = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldName = prefix ? `${prefix}.${key}` : key;

          if (key === 'media') {
            // Skip media, handle separately
            return;
          }

          if (value === undefined || value === null) {
            return;
          }

          if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob) && !Array.isArray(value)) {
            // Recursively handle nested objects
            appendToFormData(value, fieldName);
          } else if (Array.isArray(value)) {
            // Handle arrays
            value.forEach((item, index) => {
              if (typeof item === 'object' && !(item instanceof File) && !(item instanceof Blob)) {
                appendToFormData(item, `${fieldName}[${index}]`);
              } else {
                formData.append(`${fieldName}[${index}]`, item);
              }
            });
          } else {
            formData.append(fieldName, value as string | Blob);
          }
        });
      };

      // Append all fields using the helper function
      appendToFormData(reportData);

      // Append media files
      if (reportData.media && Array.isArray(reportData.media)) {
        reportData.media.forEach((file: File) => {
          formData.append('media', file);
        });
      }

      // Debug: Log FormData contents
      console.log('submitAnonymousReport: Sending FormData to backend');
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await apiService['handleRequest'](
        apiService['api'].post('/reports/anonymous', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );

      console.log('submitAnonymousReport: Backend response:', response);
      return response;

    } catch (error) {
      console.error('submitAnonymousReport: Error occurred:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit anonymous report'
      };
    }
  },

  // Get user's own reports
  getMyReports: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `/reports/my-reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService['handleRequest'](apiService['api'].get(url));
  },

  // Update report status (admin/police only)
  updateReportStatus: async (id: string, status: string, reason?: string, notes?: string): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put(`/reports/${id}/status`, { status, reason, notes })
    );
  },

  assignReport: async (id: string, assigneeId: string): Promise<ApiResponse<Report>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].post(`/reports/${id}/assign`, { assigneeId })
    );
  },
};

// Messages API
export const messagesApi = {
  getMessages: async (reportId?: string): Promise<GlobalApiResponse<Message[]>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    const url = reportId ? `/messages?reportId=${reportId}` : '/messages';
    return apiService['handleRequest']<Message[]>( // Added Message[] type
      apiService['api'].get(url)
    );
  },

  sendMessage: async (messageData: MessageForm): Promise<GlobalApiResponse<Message>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    const formData = new FormData();

    Object.entries(messageData).forEach(([key, value]) => {
      if (key !== 'attachments' && value !== undefined && value !== null) {
         if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob); // Type assertion
        }
      }
    });

    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      messageData.attachments.forEach((file: File) => { // Added File type
        formData.append('attachments', file);
      });
    }

    return apiService['handleRequest']<Message>( // Added Message type
      apiService['api'].post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  markAsRead: async (messageId: string): Promise<GlobalApiResponse<{ message: string }>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put(`/messages/${messageId}/read`)
    );
  },
};

// Statistics API
export const statisticsApi = {
  getStatistics: async (): Promise<GlobalApiResponse<Statistics>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest']<Statistics>( // Added Statistics type
      apiService['api'].get('/statistics')
    );
  },

  getDashboardData: async (): Promise<GlobalApiResponse<DashboardData>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest']<DashboardData>( // Added DashboardData type
      apiService['api'].get('/dashboard')
    );
  },
};

// Users API (Admin only)
export const usersApi = {
  getUsers: async (page = 1, limit = 10): Promise<GlobalApiResponse<PaginatedResponse<User>>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest']<PaginatedResponse<User>>( // Added PaginatedResponse<User> type
      apiService['api'].get(`/users?page=${page}&limit=${limit}`)
    );
  },

  getUser: async (id: string): Promise<GlobalApiResponse<User>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest']<User>( // Added User type
      apiService['api'].get(`/users/${id}`)
    );
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<GlobalApiResponse<User>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest']<User>( // Added User type
      apiService['api'].put(`/users/${id}`, userData)
    );
  },

  deleteUser: async (id: string): Promise<GlobalApiResponse<{ message: string }>> => { // Used GlobalApiResponse
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].delete(`/users/${id}`)
    );
  },
};

export default {
  auth: authApi,
  reports: reportsApi,
  messages: messagesApi,
  statistics: statisticsApi,
  users: usersApi,
};
