import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Prevent duplicates from multiple real-time paths
      if (prev.some(n => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const res = await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ));
      // Use server-provided count or decrement locally
      setUnreadCount(res.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, [unreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }, []);

  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const value = {
    notifications, unreadCount,
    fetchNotifications, addNotification, 
    markAsRead, markAllAsRead, updateUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
