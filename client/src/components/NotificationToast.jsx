import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import './NotificationToast.css';

/**
 * NotificationToast Component
 * 
 * Provides unobtrusive real-time alerts for background activity 
 * (mentions, DMs received in other channels).
 */
const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);
  const { notifications } = useNotification();
  const { currentRoom, currentConversation } = useChat();
  const navigate = useNavigate();

  const prevCountRef = useRef(0);

  useEffect(() => {
    // 1. Detect if a new notification has arrived
    if (notifications.length > prevCountRef.current && prevCountRef.current > 0) {
      const newest = notifications[0];

      // 2. Filter: Don't show toast if user is already looking at the message's source
      const isViewingSource = 
        (newest.room_id && currentRoom?.id === newest.room_id) ||
        (newest.conversation_id && currentConversation?.id === newest.conversation_id);

      if (!isViewingSource) {
        addToast(newest);
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length, currentRoom, currentConversation]);

  const addToast = (notification) => {
    const toastId = Date.now();
    setToasts(prev => {
      const updated = [...prev, { ...notification, toastId }];
      // Keep only most recent 3 to avoid clutter
      return updated.slice(-3);
    });

    // Auto-dismiss
    setTimeout(() => removeToast(toastId), 4000);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const handleClick = (toast) => {
    if (toast.room_id) {
      navigate(`/dashboard/rooms/${toast.room_id}`);
    } else if (toast.conversation_id) {
      // For DMs, we navigate by the user ID
      // Assuming source_user_id is provided in notification payload
      navigate(`/dashboard/dm/${toast.source_user_id || toast.sender_id}`);
    }
    removeToast(toast.toastId);
  };

  return (
    <div className="toast-stack">
      {toasts.map(toast => (
        <div 
          key={toast.toastId} 
          className="toast-item animate-slideInRight"
          onClick={() => handleClick(toast)}
        >
          <div className="toast-icon">
            {toast.type === 'mention' ? '📢' : '💬'}
          </div>
          <div className="toast-body">
            <h5 className="toast-title">New {toast.type}</h5>
            <p className="toast-text">{toast.content}</p>
          </div>
          <button 
            className="toast-close" 
            onClick={(e) => { e.stopPropagation(); removeToast(toast.toastId); }}
          >
            ✕
          </button>
          <div className="toast-progress"></div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
