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

  createServiceLog: async (deviceId, logData) => {
    const response = await API.post(`/hardware/${deviceId}/service`, logData);
    return response.data;
  },

  getAllServiceLogs: async (params = {}) => {
    const response = await API.get('/hardware/service-logs/all', { params });
    return response.data;
  },

  updateServiceLog: async (logId, logData) => {
    const response = await API.put(`/hardware/service-logs/${logId}`, logData);
    return response.data;
  }
};