// src/services/authService.js
import API from './api';

export const authService = {
  // Dual-way login (email, userId, or phone)
  login: async (identifier, password) => {
    const response = await API.post('/auth/login', { identifier, password });
    return response.data;
  },

  // Request password reset email link
  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password using secure token
  resetPassword: async (token, password) => {
    const response = await API.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout: async () => {
    const response = await API.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  }
};