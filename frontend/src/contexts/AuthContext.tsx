import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../services/api';

// Define types locally to avoid import issues
enum UserRole {
  USER = 'user',
  POLICE = 'police',
  ADMIN = 'admin'
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: UserRole;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<ApiResponse<{ user: User; token: string }>>;
  register: (userData: RegisterForm) => Promise<ApiResponse<{ user: User; token: string }>>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('auth-token');
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('auth-token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);

      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        localStorage.setItem('auth-token', token);
        setUser(userData);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        const { user: newUser, token } = response.data;
        localStorage.setItem('auth-token', token);
        setUser(newUser);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<ApiResponse<any>> => {
    try {
      setIsLoading(true);
      const response = await authApi.logout();

      // Always clear local state regardless of API response
      setUser(null);

      return response;
    } catch (error) {
      // Even if API call fails, clear local state
      setUser(null);
      return {
        success: false,
        error: 'Logout failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(userData);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
