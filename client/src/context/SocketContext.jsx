import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { createConnection } from '../services/socketService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      console.log('[SocketContext] Connecting to server...');
      const socket = createConnection(token);
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('[SocketContext] Connected:', socket.id);
        
        // *** CRITICAL: Sync room memberships immediately after connection ***
        socket.emit('join_all_rooms');
      });

      socket.on('rooms_joined', (data) => {
        console.log(`[SocketContext] Successfully joined ${data.count} room channels`);
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('[SocketContext] Disconnected:', reason);
      });

      socket.on('connect_error', (err) => {
        console.error('[SocketContext] Connection error:', err.message);
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, token]);

  const value = React.useMemo(() => ({ 
    socket: socketRef.current, 
    isConnected 
  }), [socketRef.current, isConnected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
