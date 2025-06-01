import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // Import ReactNode as type
import { authApi } from '../services/api';
import type { UserRole } from '../types'; // Import UserRole from global types

// Removed local UserRole enum

interface User { // This User interface is also defined in ../types. Consider importing.
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
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth-token');

        if (!token) {
          console.log('No token found, setting initialized state');
          setUser(null);
          return;
        }

        const response = await authApi.getCurrentUser();
        console.log('getCurrentUser response:', response);
        
        if (response.success && response.data) {
          console.log('User authenticated:', response.data.role);
          setUser(response.data);
        } else {
          console.log('Token invalid, clearing auth state');
          localStorage.removeItem('auth-token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth-token');
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      console.log('AuthContext login: Raw response from authApi.login:', JSON.stringify(response, null, 2)); // Log the whole response

      if (response.success && response.data && response.data.data) {
        const { user: userData, token } = response.data.data;
        console.log('Login successful - user data:', userData);
        localStorage.setItem('auth-token', token);
        setUser(userData);
        console.log('AuthContext: User set after login:', userData);
        // Immediately after setting user, isAuthenticated should be true if userData is not null
        console.log('AuthContext: isAuthenticated after login (expected true):', !!userData);
      }
      // Ensure isLoading is false before returning
      setIsLoading(false);
      console.log('AuthContext: login function returning. isLoading:', false, 'Response:', response);
      return response;
    } catch (error) {
      setIsLoading(false); // Ensure isLoading is false on error too
      console.error('Login error in AuthContext:', error);
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
    // finally { // setIsLoading(false) is now handled in try and catch
      // setIsLoading(false);
    // }
  };

  const register = async (userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        const { user: newUser, token } = response.data;
        localStorage.setItem('auth-token', token);
        setUser(newUser);
        console.log('AuthContext: User set after registration:', newUser); // For debugging redirect
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
    isInitialized,
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
