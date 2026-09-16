import API from './api';

export const screenService = {
  getAllScreens: async () => {
    const response = await API.get('/screens');
    return response.data;
  },

  getScreenById: async (screenId) => {
    const response = await API.get(`/screens/${screenId}`);
    return response.data;
  },

  startSession: async (screenId, sessionData) => {
    const response = await API.post(`/screens/${screenId}/start`, sessionData);
    return response.data;
  },

  extendSession: async (screenId, payload = { additionalMinutes: 30 }) => {
    const response = await API.post(`/screens/${screenId}/extend`, payload);
    return response.data;
  },

  checkoutSession: async (screenId, checkoutData) => {
    const response = await API.post(`/screens/${screenId}/checkout`, checkoutData);
    return response.data;
  }
};