// src/services/socket.js
import { io } from 'socket.io-client';

const rawUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

// Strip trailing /api or trailing slashes so Socket.io connects to the root host
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['polling', 'websocket'], // Starts with HTTP long-polling to bypass proxy websocket blocks
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});