// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    // Reject original error object so full error metadata remains intact for frontend catch blocks
    return Promise.reject(error);
  }
);

export default API;