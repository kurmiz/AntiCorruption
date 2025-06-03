import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react'; // Import ReactNode as type
import { authApi } from '../services/api';
import type { UserRole, User as GlobalUser } from '../types'; // Import UserRole and User as GlobalUser
import { jwtDecode } from 'jwt-decode';

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
    const initializeAuth = () => { // Removed async as we are not awaiting inside directly for API calls
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const decodedToken: { exp: number } = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp < currentTime) {
            // Token expired
            console.log('Token expired, clearing auth state');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            // Valid token
            console.log('Token valid, rehydrating user state');
            setUser(JSON.parse(storedUser) as GlobalUser);
          }
        } catch (error) {
          console.error('Error decoding token or parsing user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('No token or user found in localStorage, setting to null');
        setUser(null);
      }
      setIsLoading(false);
      setIsInitialized(true); // Ensure this is called after all checks
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<ApiResponse<{ user: GlobalUser; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      console.log('AuthContext login: Raw response from authApi.login:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        if (userData && token) {
          console.log('Login successful - user data:', userData);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData)); // Save user to localStorage
          setUser(userData as GlobalUser);
          console.log('AuthContext: User set after login:', userData);
          console.log('AuthContext: isAuthenticated after login (expected true):', !!userData);
          
          return {
            success: true,
            data: { user: userData, token }
          };
        }
      }
      
      console.log('AuthContext: login function returning. isLoading:', isLoading, 'Response:', response);
      return response;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterForm): Promise<ApiResponse<{ user: GlobalUser; token: string }>> => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        const { user: newUser, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser)); // Save user to localStorage
        setUser(newUser as GlobalUser);
        console.log('AuthContext: User set after registration:', newUser);
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
      // Attempt API logout, but proceed with local cleanup regardless of success
      await authApi.logout();
    } catch (error) {
      console.error('API logout failed, proceeding with local cleanup:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Clear user from localStorage
      setUser(null);
      setIsLoading(false);
      // Return a success response for local logout, as the primary goal is to clear client-side auth
      return { success: true, message: 'Logged out successfully locally.' };
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