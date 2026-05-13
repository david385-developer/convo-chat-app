import { io } from 'socket.io-client';

/**
 * SOCKET SERVICE
 * Factory for creating secure WebSocket connections.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

export const createConnection = (token) => {
  return io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'] // Force websocket for better performance and consistency
  });
};
