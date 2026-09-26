// src/services/pricingService.js
import API from './api';

export const pricingService = {
  getPricing: async () => {
    const response = await API.get('/pricing');
    return response.data;
  },

  updatePricing: async (pricingData) => {
    const response = await API.put('/pricing', pricingData);
    return response.data;
  }
};