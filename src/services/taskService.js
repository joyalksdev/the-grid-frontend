// src/services/taskService.js
import API from './api';

export const taskService = {
  getTasks: async (params = {}) => {
    const response = await API.get('/tasks', { params });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await API.post('/tasks', taskData);
    return response.data;
  },

  updateTaskStatus: async (id, status, notes = '') => {
    const response = await API.patch(`/tasks/${id}/status`, { status, notes });
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await API.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await API.delete(`/tasks/${id}`);
    return response.data;
  }
};