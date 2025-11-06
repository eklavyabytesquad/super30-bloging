'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to hash password using SHA-256
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Helper function to generate a random token
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Helper function to get device info
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: new Date().toISOString()
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        // Verify token is still valid
        const { data, error } = await supabase
          .from('user_tokens')
          .select('*, users(*)')
          .eq('token', storedToken)
          .is('logout_time', null)
          .gt('expired_at', new Date().toISOString())
          .single();

        if (data && !error) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password, gender = null, age = null, role = 'EDITOR') => {
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Insert new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            full_name: fullName,
            gender,
            age,
            role
          }
        ])
        .select()
        .single();

      if (userError) throw userError;

      // Auto login after registration
      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Find user with matching email and password
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', hashedPassword)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const authToken = generateToken();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24); // Token expires in 24 hours

      // Create user token
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .insert([
          {
            user_id: userData.id,
            token: authToken,
            expired_at: expirationTime.toISOString(),
            login_time: new Date().toISOString(),
            device_info: getDeviceInfo()
          }
        ])
        .select()
        .single();

      if (tokenError) throw tokenError;

      // Remove password from user data
      const { password: _, ...userWithoutPassword } = userData;

      // Store in state and localStorage
      setUser(userWithoutPassword);
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(userWithoutPassword));

      return { user: userWithoutPassword, token: authToken };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Update logout_time in user_tokens
        await supabase
          .from('user_tokens')
          .update({ logout_time: new Date().toISOString() })
          .eq('token', token);
      }

      // Clear state and localStorage
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
      localStorage.setItem('user_data', JSON.stringify(userWithoutPassword));

      return userWithoutPassword;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Verify old password
      const hashedOldPassword = await hashPassword(oldPassword);
      const { data: userData } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .single();

      if (userData.password !== hashedOldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update with new password
      const hashedNewPassword = await hashPassword(newPassword);
      const { error } = await supabase
        .from('users')
        .update({ password: hashedNewPassword })
        .eq('id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    changePassword,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
