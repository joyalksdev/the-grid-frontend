// client/src/services/userService.js
import API from "./api"; // Axios instance configured with baseURL and Auth headers

export const userService = {
  // Fetch all staff members / users
  getUsers: async () => {
    const response = await API.get("/users");
    return response.data;
  },

  // Fetch single user by ID
  getUserById: async (id) => {
    const response = await API.get(`/users/${id}`);
    return response.data;
  },

  // Create a new staff member
  createUser: async (userData) => {
    const response = await API.post("/users", userData);
    return response.data;
  },

  // Update existing user details or role
  updateUser: async (id, userData) => {
    const response = await API.put(`/users/${id}`, userData);
    return response.data;
  },

  // Toggle user active / inactive status
  toggleUserStatus: async (id) => {
    const response = await API.patch(`/users/${id}/status`);
    return response.data;
  },

  // Delete a user account
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};