import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../services/apiService';

interface User {
  id: string | number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  isAdmin?: boolean;
  verified?: boolean | number;
}

interface UserAuthContextType {
  user: User | null;
  userVersion: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isVerified: boolean;
  loading: boolean;
  error: string | null;
  fetchAndSetProfile: () => Promise<boolean>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// Add API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userVersion, setUserVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('user_token'));
  const navigate = useNavigate();

  const checkTokenExpiry = (token: string): boolean => {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const fetchAndSetProfile = async () => {
    try {
      const res = await apiService.get('/backend/user/profile.php');
      console.log('Profile API response:', res);
      if ((res.ok || res.success) && res.data) {
        setUser(res.data);
        setUserVersion(v => v + 1);
        console.log('[UserAuthContext] setUser (fetchAndSetProfile):', res.data);
        return true;
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
    setUser(null);
    return false;
  };

  // Fetch profile whenever token changes
  useEffect(() => {
    const syncProfile = async () => {
      setLoading(true);
      if (token && checkTokenExpiry(token)) {
        localStorage.setItem('user_token', token);
        const ok = await fetchAndSetProfile();
        if (!ok) {
          setUser(null);
          localStorage.removeItem('user_token');
        }
        setLoading(false);
      } else {
        setUser(null);
        localStorage.removeItem('user_token');
        setLoading(false);
      }
    };
    syncProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post('/backend/auth/login.php', {
        email,
        password
      });
      
      // Check if response is successful
      if (response.success && response.data && response.data.user && response.data.token) {
        setToken(response.data.token); // This will trigger the useEffect
        // No need to call fetchAndSetProfile here, useEffect will handle it
      } else {
        // Handle error response - ensure error is a string
        let errorMessage = 'Login failed';
        if (response.error) {
          // Handle both string errors and error objects
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (typeof response.error === 'object' && response.error !== null && 'message' in response.error) {
            errorMessage = String(response.error.message);
          }
        }
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage); // Re-throw to be caught by the calling component
      }
    } catch (error: any) {
      // Ensure error message is always a string
      let errorMessage = 'Login failed';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = typeof error.message === 'string' ? error.message : String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage); // Re-throw to be caught by the calling component
    }
  };

  const logout = async () => {
    try {
      await apiService.post('/backend/auth/logout.php', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user_token');
      setLoading(false);
      navigate('/login');
    }
  };

  // Check token expiry periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && !checkTokenExpiry(token)) {
        logout();
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    console.log('[UserAuthContext] user:', user, 'token:', token, 'loading:', loading);
  }, [user, token, loading]);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        userVersion,
        login,
        logout,
        isLoggedIn: !!user,
        isVerified: !!user && (user.verified === true || user.verified === 1),
        loading,
        error,
        fetchAndSetProfile
      }}
    >
      {!loading ? children : null}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within UserAuthProvider');
  }
  return context;
}; 