// src/services/bookingService.js
import api from "./api";

export const bookingService = {
  getBookings: async (params) => {
    const response = await api.get("/bookings", { params });
    return response.data;
  },
  getBookingsByScreen: async (screenId, params) => {
    const response = await api.get(`/bookings/screen/${screenId}`, { params });
    return response.data;
  },
  createBooking: async (data) => {
    const response = await api.post("/bookings", data);
    return response.data;
  },
  updateBookingStatus: async (id, status) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },
  deleteBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },
};