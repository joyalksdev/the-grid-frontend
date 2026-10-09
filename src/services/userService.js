import API from "./api";

export const userService = {
  // Update logged-in user's profile and avatar photo
  updateProfile: async (formData) => {
    const response = await API.put("/users/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Fetch all staff members / users
  getUsers: async (params) => {
    const response = await API.get("/users", { params });
    return response.data;
  },

  // Fetch single user by ID
  getUserById: async (id) => {
    const response = await API.get(`/users/${id}`);
    return response.data;
  },

  // Generate Invite Token Link
  inviteUser: async (inviteData) => {
    const response = await API.post("/auth/invite", inviteData);
    return response.data;
  },

  // Fetch Active Invite Tokens List
  getInvites: async () => {
    const response = await API.get("/auth/invites");
    return response.data;
  },

  // Revoke an Active Invite Token
  revokeInvite: async (inviteId) => {
    const response = await API.delete(`/auth/invites/${inviteId}`);
    return response.data;
  },

  // Create a user directly
  createUser: async (userData) => {
    const response = await API.post("/users", userData);
    return response.data;
  },

  // Update existing user details or role
  updateUser: async (id, userData) => {
    const response = await API.put(`/users/${id}`, userData);
    return response.data;
  },

  // Toggle user active / inactive status (Approve / Deactivate)
  toggleUserStatus: async (id) => {
    const response = await API.patch(`/users/${id}/status`);
    return response.data;
  },

  // Delete a user account
  deleteUser: async (id) => {
    const response = await API.delete(`/users/${id}`);
    return response.data;
  },
};