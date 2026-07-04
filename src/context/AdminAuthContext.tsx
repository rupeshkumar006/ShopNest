import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../services/apiService';

interface AdminUser {
  id: string | number;
  username?: string;
  isAdmin: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkTokenExpiry = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('adminUser');
    
    if (token && storedAdmin) {
      try {
        if (!checkTokenExpiry(token)) {
          // Token expired
          setAdmin(null);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('adminUser');
          setLoading(false);
          return;
        }
        
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);
      } catch (error) {
        console.error('Error checking admin auth:', error);
        setAdmin(null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminUser');
      }
    } else {
      setAdmin(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('adminUser');
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post('/backend/admin/admin_login.php', {
        username,
        password
      });
      
      if (response.success && response.data && response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        setAdmin(response.data.user);
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
    try {
      await apiService.post('/backend/admin/admin_logout.php', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
  };

  // Check token expiry periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('admin_token');
      if (token && !checkTokenExpiry(token)) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        login,
        logout,
        isAdmin: !!admin,
        loading,
        error
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}; 