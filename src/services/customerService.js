// src/services/customerService.js
import API from "./api";

export const customerService = {
  searchCustomers: async (query) => {
    const response = await API.get("/customers/search", { params: { q: query } });
    return response.data;
  },
};