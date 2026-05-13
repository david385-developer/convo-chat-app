import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import Modal from './Modal';
import './NotificationPanel.css';

/**
 * NotificationPanel Component
 * 
 * Displays a prioritized list of real-time alerts.
 * Features:
 * 1. Type-based styling (Mentions vs Messages vs System).
 * 2. Intelligent navigation based on notification source.
 * 3. Mark as read on click.
 */
const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const { conversations } = useChat();
  const navigate = useNavigate();

  const handleNotifClick = (n) => {
    // 1. Persist read status
    markAsRead(n.id);

    // 2. Resolve destination
    if (n.room_id) {
      // It's a room mention or message
      navigate(`/dashboard/rooms/${n.room_id}`);
    } else if (n.conversation_id) {
      // It's a DM mention or message
      // Find the other user ID in this conversation to navigate to the correct DM route
      const conv = conversations.find(c => c.id === n.conversation_id);
      if (conv?.other_user_id) {
        navigate(`/dashboard/dm/${conv.other_user_id}`);
      }
    }

    // 3. Close UI
    onClose();
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const headerActions = notifications.some(n => !n.is_read) ? (
    <button className="mark-all-btn" onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: '#7c3aed', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Mark all read</button>
  ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {headerActions}
      </div>
      <div className="panel-content" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            <span className="empty-icon" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎐</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${n.is_read ? '' : 'unread'} type-${n.type}`}
              onClick={() => handleNotifClick(n)}
              style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', background: n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.1)', transition: 'background 0.2s', marginBottom: '8px' }}
            >
              <div className="notif-icon" style={{ fontSize: '20px' }}>
                {n.type === 'mention' ? '📢' : n.type === 'message' ? '💬' : '🔔'}
              </div>
              <div className="notif-info" style={{ flex: 1 }}>
                <p className="notif-text" style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '14px', lineHeight: '1.4' }}>{n.content}</p>
                <span className="notif-time" style={{ color: '#64748b', fontSize: '12px' }}>{formatTime(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="notif-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', marginTop: '6px' }}></span>}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default NotificationPanel;
