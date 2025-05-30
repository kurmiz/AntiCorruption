// Define basic types locally to avoid import issues
interface ApiResponse<T> {
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
  private api: typeof axios;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
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
          localStorage.removeItem('auth_token');
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
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred',
      };
    }
  }
}

// Mock Authentication API
export const authApi = {
  login: async (credentials: any): Promise<ApiResponse<any>> => {
    await mockDelay(800); // Simulate network delay

    const user = mockUsers.find(u =>
      u.email === credentials.email && u.password === credentials.password
    );

    if (user) {
      const token = `mock-jwt-token-${user.id}`;
      const userWithoutPassword = { ...user };
      delete (userWithoutPassword as any).password;

      // Store in localStorage for persistence
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(userWithoutPassword));

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token
        },
        message: 'Login successful'
      };
    } else {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
  },

  register: async (userData: any): Promise<ApiResponse<any>> => {
    await mockDelay(1000); // Simulate network delay

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }

    // Create new user
    const newUser = {
      id: String(mockUsers.length + 1),
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockUsers.push(newUser);

    const token = `mock-jwt-token-${newUser.id}`;
    const userWithoutPassword = { ...newUser };
    delete (userWithoutPassword as any).password;

    // Store in localStorage for persistence
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(userWithoutPassword));

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Registration successful'
    };
  },

  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    await mockDelay(300); // Simulate network delay

    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          success: true,
          data: user,
          message: 'User retrieved successfully'
        };
      } catch (error) {
        return {
          success: false,
          error: 'Invalid user data'
        };
      }
    } else {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }
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
    await mockDelay(300); // Simulate network delay

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
      if (key !== 'media' && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    // Append media files
    if (reportData.media) {
      reportData.media.forEach((file) => {
        formData.append('media', file);
      });
    }

    return apiService['handleRequest'](
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
  getMessages: async (reportId?: string): Promise<ApiResponse<Message[]>> => {
    const apiService = new ApiService();
    const url = reportId ? `/messages?reportId=${reportId}` : '/messages';
    return apiService['handleRequest'](
      apiService['api'].get(url)
    );
  },

  sendMessage: async (messageData: MessageForm): Promise<ApiResponse<Message>> => {
    const apiService = new ApiService();
    const formData = new FormData();

    Object.entries(messageData).forEach(([key, value]) => {
      if (key !== 'attachments' && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (messageData.attachments) {
      messageData.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    return apiService['handleRequest'](
      apiService['api'].post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  markAsRead: async (messageId: string): Promise<ApiResponse<{ message: string }>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put(`/messages/${messageId}/read`)
    );
  },
};

// Statistics API
export const statisticsApi = {
  getStatistics: async (): Promise<ApiResponse<Statistics>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get('/statistics')
    );
  },

  getDashboardData: async (): Promise<ApiResponse<DashboardData>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get('/dashboard')
    );
  },
};

// Users API (Admin only)
export const usersApi = {
  getUsers: async (page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get(`/users?page=${page}&limit=${limit}`)
    );
  },

  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].get(`/users/${id}`)
    );
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const apiService = new ApiService();
    return apiService['handleRequest'](
      apiService['api'].put(`/users/${id}`, userData)
    );
  },

  deleteUser: async (id: string): Promise<ApiResponse<{ message: string }>> => {
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
