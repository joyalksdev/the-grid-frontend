// src/services/hardwareService.js
import API from './api';

export const hardwareService = {
  getDevices: async (params = {}) => {
    const response = await API.get('/hardware', { params });
    return response.data;
  },

  createDevice: async (deviceData) => {
    const response = await API.post('/hardware', deviceData);
    return response.data;
  },

  updateDevice: async (id, deviceData) => {
    const response = await API.put(`/hardware/${id}`, deviceData);
    return response.data;
  },

  reportIssue: async (id, issueData) => {
    const response = await API.patch(`/hardware/${id}/issue`, issueData);
    return response.data;
  },

  resolveIssue: async (id, resolveData) => {
    const response = await API.patch(`/hardware/${id}/resolve`, resolveData);
    return response.data;
  },

  deleteDevice: async (id) => {
    const response = await API.delete(`/hardware/${id}`);
    return response.data;
  }
};