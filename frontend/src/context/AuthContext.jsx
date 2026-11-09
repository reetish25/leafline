import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('leafline_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user session:', err);
        localStorage.removeItem('leafline_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('leafline_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('leafline_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const updated = await api.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const updated = await api.changePassword(currentPassword, newPassword);
    setUser(updated);
    return updated;
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword(email);
  };

  const resetPassword = async (resetToken, newPassword) => {
    return await api.resetPassword(resetToken, newPassword);
  };

  const value = {
    user,
    token,
    loading,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    mustChangePassword: !!user?.must_change_password,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
