import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // Import ReactNode as type
import { authApi } from '../services/api';
import type { UserRole, User as GlobalUser } from '../types'; // Import UserRole and User as GlobalUser

// Removed local UserRole enum
// Removed local User interface, will use GlobalUser

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
  user: GlobalUser | null; // Changed to GlobalUser
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<ApiResponse<{ user: GlobalUser; token: string }>>; // Changed to GlobalUser
  register: (userData: RegisterForm) => Promise<ApiResponse<{ user: GlobalUser; token: string }>>; // Changed to GlobalUser
  logout: () => void;
  updateUser: (userData: Partial<GlobalUser>) => Promise<void>; // Changed to GlobalUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GlobalUser | null>(null); // Changed to GlobalUser
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          console.log('No token found, setting initialized state');
          setUser(null);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        const response = await authApi.getCurrentUser();
        console.log('getCurrentUser raw response:', JSON.stringify(response, null, 2));
        
        // Detailed response structure logging
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        
        if (response.success && response.data) {
          const userData = response.data as GlobalUser; // Assert type to GlobalUser
          console.log('Extracted user data:', JSON.stringify(userData, null, 2));
          console.log('User role:', userData?.role);
          console.log('Full user object:', userData);
          
          setUser(userData);
        } else {
          console.log('Token invalid, clearing auth state');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<ApiResponse<{ user: GlobalUser; token: string }>> => { // Use GlobalUser
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      console.log('AuthContext login: Raw response from authApi.login:', JSON.stringify(response, null, 2)); // Log the whole response

      if (response.success && response.data) {
        // The API response is nested: response.data contains the actual response data
        // Extract user and token from the correct location
        const { user: userData, token } = response.data;
        
        if (userData && token) {
          console.log('Login successful - user data:', userData);
          localStorage.setItem('token', token);
          setUser(userData as GlobalUser); // Assert type to GlobalUser
          console.log('AuthContext: User set after login:', userData);
          // Immediately after setting user, isAuthenticated should be true if userData is not null
          console.log('AuthContext: isAuthenticated after login (expected true):', !!userData);
          
          return {
            success: true,
            data: { user: userData, token }
          };
        }
      }
      
      // If we get here, there was a problem with the response structure
      console.log('AuthContext: login function returning. isLoading:', isLoading, 'Response:', response);
      // Ensure the return type matches the promise, assuming response.data is now correctly structured
      // If response.data is { user: GlobalUser, token: string }, this cast is fine.
      // However, the actual 'response' object from authApi.login is GlobalApiResponse<{user: GlobalUser, token: string}>
      // So, if response.data is already {user, token}, then the cast should be to that.
      // The function signature is Promise<ApiResponse<{ user: GlobalUser; token: string }>>
      // The 'response' variable here IS that type if the API call was successful and structured as expected.
      return response; // No cast needed if 'response' already matches the return type.
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterForm): Promise<ApiResponse<{ user: GlobalUser; token: string }>> => { // Changed to GlobalUser
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        const { user: newUser, token } = response.data; // newUser should be GlobalUser
        localStorage.setItem('token', token);
        setUser(newUser as GlobalUser); // Assert type to GlobalUser
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
      localStorage.removeItem('token');
      setUser(null);

      return response;
    } catch (error) {
      // Even if API call fails, clear local state
      localStorage.removeItem('token');
      setUser(null);
      return {
        success: false,
        error: 'Logout failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<GlobalUser>) => { // Changed to GlobalUser
    try {
      const response = await authApi.updateProfile(userData);
      if (response.success && response.data) {
        setUser(response.data as GlobalUser); // Assert type to GlobalUser
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