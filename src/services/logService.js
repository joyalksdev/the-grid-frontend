// src/services/logService.js
import API from './api';

export const logService = {
  getLogs: async (params = {}) => {
    const response = await API.get('/logs', { params });
    return response.data;
  },

  getMetrics: async () => {
    const response = await API.get('/logs/metrics');
    return response.data;
  },

  getAnalytics: async (params = {}) => {
    const response = await API.get('/analytics', { params });
    return response.data;
  },

  createLog: async (logData) => {
    const response = await API.post('/logs', logData);
    return response.data;
  },

  updateLog: async (id, data) => {
    const response = await API.put(`/logs/${id}`, data);
    return response.data;
  },

  deleteLog: async (id) => {
    const response = await API.delete(`/logs/${id}`);
    return response.data;
  }
};