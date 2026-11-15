// src/services/gameService.js
import api from "./api";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

/**
 * Converts the admin game form into multipart FormData.
 * Arrays are sent as JSON strings; images only when a new file was picked.
 */
export function buildGameFormData(form) {
  const fd = new FormData();

  fd.append("title", form.title.trim());
  fd.append("genre", form.genre.trim());
  fd.append("description", (form.description || "").trim());
  fd.append("platform", form.platform);
  fd.append("supportedModes", JSON.stringify(form.supportedModes || []));
  fd.append("recommendedMode", form.recommendedMode || "");
  fd.append("minPlayers", String(form.minPlayers));
  fd.append("maxPlayers", String(form.maxPlayers));
  fd.append("availableScreens", JSON.stringify(form.availableScreens || []));
  fd.append("assignedHardware", JSON.stringify(form.assignedHardware || []));
  fd.append("isFeatured", String(Boolean(form.isFeatured)));
  fd.append("isActive", String(Boolean(form.isActive)));

  if (form.thumbnailFile) fd.append("thumbnail", form.thumbnailFile);
  if (form.coverFile) fd.append("cover", form.coverFile);

  return fd;
}

export const gameService = {
  getGames: async () => {
    const response = await api.get("/games");
    return response.data;
  },

  getOptions: async () => {
    const response = await api.get("/games/options");
    return response.data;
  },

  // form = admin form state (with thumbnailFile / coverFile)
  createGame: async (form) => {
    const response = await api.post("/games", buildGameFormData(form), MULTIPART);
    return response.data;
  },

  updateGame: async (id, form) => {
    const response = await api.put(`/games/${id}`, buildGameFormData(form), MULTIPART);
    return response.data;
  },

  // Lightweight JSON patch (station matrix drag-drop, active toggle, etc.)
  patchGame: async (id, fields) => {
    const response = await api.put(`/games/${id}`, fields);
    return response.data;
  },

  deleteGame: async (id) => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};
