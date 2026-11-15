// src/services/notificationService.js
import API from "./api";

export const notificationService = {
  getNotifications: async () => {
    const response = await API.get("/notifications");
    return response.data;
  },

  createNotification: async (payload) => {
    const response = await API.post("/notifications", payload);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await API.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await API.patch("/notifications/read-all");
    return response.data;
  },

  acknowledgeModal: async (id) => {
    const response = await API.patch(`/notifications/${id}/acknowledge`);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await API.delete(`/notifications/${id}`);
    return response.data;
  },
};
