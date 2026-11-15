// src/constants/games.js
export const GAME_MODES = [
  { key: "Single", label: "Single", sub: "1 Player" },
  { key: "Dual", label: "Dual", sub: "2 Players" },
  { key: "Triple", label: "Triple", sub: "3 Players" },
  { key: "Big", label: "Big", sub: "4 Players" },
  { key: "SimDrive", label: "SimDrive", sub: "Racing Rig" },
  { key: "GTA6_Launch", label: "GTA 6 Launch", sub: "Special" },
];

export const GAME_PLATFORMS = [
  { key: "PS5", label: "PlayStation 5" },
  { key: "SimDrive", label: "SimDrive Wheel" },
  { key: "PC", label: "PC" },
];

export const GAME_IMAGE_RULES = {
  maxSizeMB: 5,
  accept: "image/jpeg,image/png,image/webp,image/avif",
};

export const getModeLabel = (key) =>
  GAME_MODES.find((m) => m.key === key)?.label || key;

export const EMPTY_GAME_FORM = {
  title: "",
  genre: "",
  description: "",
  platform: "PS5",
  supportedModes: ["Single"],
  recommendedMode: "Single",
  minPlayers: 1,
  maxPlayers: 1,
  availableScreens: [],
  assignedHardware: [],
  isFeatured: false,
  isActive: true,
  thumbnailFile: null,
  coverFile: null,
  thumbnailPreview: "",
  coverPreview: "",
};
