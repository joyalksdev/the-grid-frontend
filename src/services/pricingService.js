// src/services/pricingService.js
import API from './api';

export const pricingService = {
  getPricing: async () => {
    const response = await API.get('/pricing');
    return response.data;
  },

  updatePricing: async (matrix) => {
    const response = await API.put('/pricing', { matrix });
    return response.data;
  },

  resetPricing: async () => {
    const response = await API.post('/pricing/reset');
    return response.data;
  },

  createOffer: async (offerData) => {
    const response = await API.post('/pricing/offers', offerData);
    return response.data;
  },

  updateOffer: async (offerId, offerData) => {
    const response = await API.put(`/pricing/offers/${offerId}`, offerData);
    return response.data;
  },

  deleteOffer: async (offerId) => {
    const response = await API.delete(`/pricing/offers/${offerId}`);
    return response.data;
  }
};