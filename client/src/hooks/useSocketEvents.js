import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { useNotification } from '../context/NotificationContext';

export default function useSocketEvents() {
  const { socket } = useSocket();
  const chat = useChat();
  const notify = useNotification();

  // Latest Ref pattern to avoid listener churn
  const handlersRef = useRef(null);
  
  // Update refs on every render
  handlersRef.current = {
    ...chat,
    ...notify
  };

  useEffect(() => {
    if (!socket) return;

    const s = socket;
    console.log('[useSocketEvents] Attaching stable listeners');

    // --- MESSAGE EVENTS ---
    s.on('receive_message', (m) => handlersRef.current.addMessage(m));
    s.on('message_updated', (m) => handlersRef.current.updateMessage(m.id, m));
    s.on('message_deleted', (d) => handlersRef.current.removeMessage(d.messageId));
    s.on('message_delivered', (d) => handlersRef.current.updateMessage(d.messageId, { status: 'delivered' }));

    // --- RECEIPT EVENTS ---
    s.on('message_read_update', (d) => handlersRef.current.updateMessage(d.messageId, { newReaderId: d.userId, readAt: d.readAt }));
    s.on('messages_read_update', (d) => {
      d.messageIds.forEach(id => {
        handlersRef.current.updateMessage(id, { newReaderId: d.userId, readAt: d.readAt });
      });
    });

    // --- TYPING EVENTS ---
    s.on('user_typing', (d) => handlersRef.current.setTyping(d.contextId, d.userId, d.username, true));
    s.on('user_stop_typing', (d) => handlersRef.current.setTyping(d.contextId, d.userId, null, false));

    // --- PRESENCE EVENTS ---
    s.on('user_online', (d) => handlersRef.current.updatePresence(d.userId, 'online', d.user));
    s.on('user_offline', (d) => handlersRef.current.updatePresence(d.userId, 'offline'));
    s.on('online_users_list', (u) => handlersRef.current.updateOnlineUsersList(u));

    // --- ROOM EVENTS ---
    s.on('room_members_updated', (d) => handlersRef.current.setRoomMembers(d.roomId, d.members));

    // --- NOTIFICATION EVENTS ---
    s.on('new_notification', (n) => handlersRef.current.addNotification(n));
    s.on('unread_count_update', (d) => handlersRef.current.updateUnreadCount(d.count));
    s.on('error', (d) => console.error('[useSocketEvents] Server error:', d.message));

    return () => {
      console.log('[useSocketEvents] Detaching stable listeners');
      s.off('receive_message');
      s.off('message_updated');
      s.off('message_deleted');
      s.off('message_delivered');
      s.off('message_read_update');
      s.off('messages_read_update');
      s.off('user_typing');
      s.off('user_stop_typing');
      s.off('user_online');
      s.off('user_offline');
      s.off('online_users_list');
      s.off('room_members_updated');
      s.off('new_notification');
      s.off('unread_count_update');
      s.off('error');
    };
  }, [socket]);
}
