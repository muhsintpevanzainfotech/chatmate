import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsersMap, setOnlineUsersMap] = useState(new Map());
  const [onlineCount, setOnlineCount] = useState(0);

  // Fetch initial online count via public API
  useEffect(() => {
    fetch('/api/stats/online-count')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.onlineCount === 'number') {
          setOnlineCount(data.onlineCount);
        }
      })
      .catch((err) => console.warn('Failed to fetch online count:', err));
  }, []);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketTarget = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketTarget, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected securely');
    });

    socketInstance.on('online:count', ({ onlineCount: count }) => {
      if (typeof count === 'number') {
        setOnlineCount(count);
      }
    });

    socketInstance.on('user:presence', ({ userId, online }) => {
      setOnlineUsersMap((prev) => {
        const updated = new Map(prev);
        updated.set(userId, online);
        return updated;
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsersMap, onlineCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

