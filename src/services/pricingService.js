// src/services/pricingService.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/pricing`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: token ? `Bearer ${token}` : '' },
    withCredentials: true
  };
};

export const pricingService = {
  getPricing: async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  },

  updatePricing: async (pricingData) => {
    const response = await axios.put(API_URL, pricingData, getAuthHeaders());
    return response.data;
  }
};