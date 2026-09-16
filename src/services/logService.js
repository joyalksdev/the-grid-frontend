import API from './api';

export const logService = {
  getLogs: async (params = {}) => {
    const response = await API.get('/logs', { params });
    return response.data;
  },

  getMetrics: async () => {
    const response = await API.get('/logs/metrics');
    return response.data;
  }
};