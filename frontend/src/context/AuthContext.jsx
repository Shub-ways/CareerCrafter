import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Base URL for FastAPI backend
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('careercrafter_user');
    const storedToken = localStorage.getItem('careercrafter_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);
  
  // Axios interceptor to add token if it somehow gets lost from defaults
  api.interceptors.request.use(config => {
    const storedToken = localStorage.getItem('careercrafter_token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.access_token) {
        const userData = { username };
        setUser(userData);
        localStorage.setItem('careercrafter_user', JSON.stringify(userData));
        localStorage.setItem('careercrafter_token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'An error occurred during login' 
      };
    }
  };

  const requestOtp = async (username, email) => {
    try {
      const response = await api.post('/auth/request-otp', { username, email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'An error occurred while requesting OTP' 
      };
    }
  };

  const verifyOtp = async (username, email, password, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { username, email, password, otp });
      if (response.data.access_token) {
        const userData = { username: response.data.username };
        setUser(userData);
        localStorage.setItem('careercrafter_user', JSON.stringify(userData));
        localStorage.setItem('careercrafter_token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Invalid OTP or an error occurred' 
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'An error occurred' 
      };
    }
  };

  const resetPassword = async (email, otp, new_password) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, new_password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Invalid OTP or an error occurred' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('careercrafter_user');
    localStorage.removeItem('careercrafter_token');
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    api,
    login,
    requestOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
