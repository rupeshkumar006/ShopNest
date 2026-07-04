import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse } from '../services/authService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import jwtDecode from 'jwt-decode';

interface User {
  id: string | number;
  username?: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('shopnestUser');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAdmin(!!parsedUser.isAdmin);
        authService.setAuthToken(token);
      } catch {
        setUser(null);
        setIsAdmin(false);
        authService.clearAuthToken();
        localStorage.removeItem('token');
        localStorage.removeItem('shopnestUser');
      }
    } else {
      setUser(null);
      setIsAdmin(false);
      authService.clearAuthToken();
      localStorage.removeItem('token');
      localStorage.removeItem('shopnestUser');
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post('/backend/admin/admin_login.php', {
        username,
        password
      });
      
      if (response.success && response.token) {
        localStorage.setItem('admin_token', response.token);
        const decoded = jwtDecode(response.token) as Admin;
        setIsAdmin(true);
        setUser(decoded);
        authService.setAuthToken(response.token);
        setLoading(false);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        setLoading(false);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      setLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('shopnestUser');
    localStorage.removeItem('shopnestCart');
    localStorage.removeItem('shopnestFavorites');
    authService.clearAuthToken();
    setLoading(false);
    navigate('/admin/login');
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      const response = await authService.deleteAccount();
      
      if (!response.success) {
        throw new Error(response.error || 'Account deletion failed');
      }

      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('shopnestUser');
      localStorage.removeItem('shopnestCart');
      localStorage.removeItem('shopnestFavorites');
      authService.clearAuthToken();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Account deletion failed');
      throw error;
    }
  };

  // Clear JWT and state on tab close
  useEffect(() => {
    const handleTabClose = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('shopnestUser');
      localStorage.removeItem('shopnestCart');
      localStorage.removeItem('shopnestFavorites');
      setUser(null);
      setIsAdmin(false);
      authService.clearAuthToken();
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        deleteAccount,
        isLoggedIn: !!user,
        isAdmin,
        loading,
        error
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
