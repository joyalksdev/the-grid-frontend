// src/services/gameService.js
import api from "./api";

export const gameService = {
  getGames: async () => {
    const response = await api.get("/games");
    return response.data;
  },
  createGame: async (data) => {
    const response = await api.post("/games", data);
    return response.data;
  },
  updateGame: async (id, data) => {
    const response = await api.put(`/games/${id}`, data);
    return response.data;
  },
  deleteGame: async (id) => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};