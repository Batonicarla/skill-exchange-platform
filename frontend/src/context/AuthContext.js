import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Sign up
  const signup = async (email, password, displayName) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName
      });

      if (response.data.success) {
        const token = response.data.token;
        if (token) {
          localStorage.setItem('supabaseToken', token);
        }
        setUserData(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        setCurrentUser({ id: response.data.data.uid, email: response.data.data.email });
        return { success: true, user: response.data.data };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || error.message;
      if (message.includes('already registered') || message.includes('already exists')) {
        throw new Error('An account with this email already exists');
      } else if (message.includes('Password')) {
        throw new Error('Password should be at least 6 characters');
      } else if (message.includes('email') || message.includes('Email')) {
        throw new Error('Invalid email address');
      }
      throw new Error(message || 'Registration failed');
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const token = response.data.token;
        if (token) {
          localStorage.setItem('supabaseToken', token);
        }
        setUserData(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        setCurrentUser({ id: response.data.data.uid, email: response.data.data.email });
        return { success: true, user: response.data.data };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message;
      if (message.includes('not found') || message.includes('Invalid')) {
        throw new Error('No account found with this email or incorrect password');
      } else if (message.includes('password')) {
        throw new Error('Incorrect password');
      } else if (message.includes('email')) {
        throw new Error('Invalid email address');
      } else if (message.includes('too many') || message.includes('rate')) {
        throw new Error('Too many failed attempts. Please try again later');
      }
      throw new Error(message || 'Login failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabaseToken');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Update user data
  const updateUserData = (data) => {
    setUserData(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setCurrentUser(session.user);
          localStorage.setItem('supabaseToken', session.access_token);
          
          // Get user data from localStorage or fetch from backend
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUserData(JSON.parse(storedUser));
          } else {
            try {
              const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
              if (response.data.success) {
                setUserData(response.data.data);
                localStorage.setItem('user', JSON.stringify(response.data.data));
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
        } else {
          setCurrentUser(null);
          setUserData(null);
          localStorage.removeItem('supabaseToken');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        localStorage.setItem('supabaseToken', session.access_token);
      } else {
        setCurrentUser(null);
        setUserData(null);
        localStorage.removeItem('supabaseToken');
        localStorage.removeItem('user');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    resetPassword,
    updateUserData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

