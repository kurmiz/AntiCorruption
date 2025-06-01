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
      baseURL: '/api', // This will be proxied by Vite dev server
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token');
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
          localStorage.removeItem('auth-token'); // Corrected token key
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleRequest<T>(request: Promise<any>): Promise<ApiResponse<T>> {
    try {
      const response = await request;
      return {
        success: true,
        data: response.data as T, // Cast response data to expected type
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred',
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
    // Transform data to match backend expectations
    const payload = {
      email: userData.email,
      password: userData.password,
      name: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      // phone: userData.phone, // If phone is to be sent, ensure backend handles it and User model has phone
    };
    return apiService['handleRequest'](
      apiService['api'].post('/auth/signup', payload)
    );
  },

  getCurrentUser: async (): Promise<GlobalApiResponse<User>> => {
    const apiService = new ApiService();
    return apiService['handleRequest']<User>(
      apiService['api'].get('/auth/me')
    );
  },

  updateProfile: async (userData: any): Promise<ApiResponse<any>> => {
    await mockDelay(800); // Simulate network delay

    const userStr = localStorage.getItem('auth-user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, ...userData, updatedAt: new Date().toISOString() };
        localStorage.setItem('auth-user', JSON.stringify(updatedUser));

        return {
          success: true,
          data: updatedUser,
          message: 'Profile updated successfully'
        };
      } catch (error) {
        return {
          success: false,
          error: 'Failed to update profile'
        };
      }
    } else {
      return {
        success: false,
        error: 'User not found'
      };
    }
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return apiService['handleRequest'](
      apiService['api'].get(`/reports?${params}`)
    );
  },

  getReport: async (id: string): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get(`/reports/${id}`)
    );
  },

  createReport: async (reportData: any): Promise<ApiResponse<any>> => {
    const apiService = new ApiService();
    const formData = new FormData();

    // Append text fields
    Object.entries(reportData).forEach(([key, value]) => {
      if (key !== 'media' && value !== undefined && value !== null) {
        if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string | Blob); // Type assertion
        }
      }
    });

    // Append media files
    if (reportData.media && Array.isArray(reportData.media)) {
      reportData.media.forEach((file: File) => { // Added File type
        formData.append('media', file);
      });
    }

    return apiService['handleRequest']<Report>( // Added Report type
      apiService['api'].post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
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
