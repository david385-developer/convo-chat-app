import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [roomMembers, setRoomMembersState] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastJoinedRoomRef] = useState({ current: null });
  const [hasMore, setHasMore] = useState(false);
  const [isUsersPanelOpen, setIsUsersPanelOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);

  const toggleUsersPanel = useCallback(() => {
    setIsUsersPanelOpen(prev => !prev);
  }, []);

  const toggleMobileSidebar = useCallback((val) => {
    setIsMobileSidebarOpen(prev => typeof val === 'boolean' ? val : !prev);
  }, []);

  const toggleMobileMembers = useCallback((val) => {
    setIsMobileMembersOpen(prev => typeof val === 'boolean' ? val : !prev);
  }, []);

  const processMessages = useCallback((msgs) => {
    if (!user) return msgs;
    return msgs.map(m => ({
      ...m,
      isOwn: m.sender_id === user.id
    }));
  }, [user]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  /**
   * selectRoom
   * Fetches room details and history. Robust against empty room lists.
   */
  const selectRoom = useCallback(async (roomId, socket) => {
    if (!roomId) return;
    console.log(`[ChatContext] Selecting room: ${roomId}`);
    
    // 1. Clear current DM state
    setCurrentConversation(null);
    
    // 2. Immediate join/tracking to prevent loops
    if (socket && lastJoinedRoomRef.current !== roomId) {
      console.log(`[ChatContext] Joining socket room: ${roomId}`);
      socket.emit('join_room', { roomId });
      lastJoinedRoomRef.current = roomId;
    }

    setIsLoadingMessages(true);

    try {
      // Fetch room details (don't rely on unstable 'rooms' list dependency)
      const roomRes = await api.get(`/rooms/${roomId}`);
      setCurrentRoom(roomRes.room);

      const res = await api.get(`/rooms/${roomId}/messages?limit=50&offset=0`);
      setMessages(processMessages(res.messages || []));
      setHasMore(res.hasMore);
      setUnreadCounts(prev => ({ ...prev, [`room:${roomId}`]: 0 }));

      const membersRes = await api.get(`/rooms/${roomId}/members`);
      setRoomMembers(roomId, membersRes.members || []);
    } catch (err) {
      console.error('[ChatContext] Failed to select room:', err);
      setMessages([]);
      setHasMore(false);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [socket, processMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const currentId = currentRoom?.id || currentConversation?.id;
    const type = currentRoom ? 'rooms' : 'conversations';
    if (!currentId) return;

    setIsLoadingMore(true);
    try {
      const offset = messages.length;
      const res = await api.get(`/${type}/${currentId}/messages?limit=50&offset=${offset}`);
      
      const newMessages = processMessages(res.messages || []);
      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('[ChatContext] Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentRoom, currentConversation, messages.length, processMessages]);

  const getOrCreateConversation = useCallback(async (targetUserId) => {
    if (!targetUserId) return null;
    setCurrentRoom(null);
    setIsLoadingMessages(true);
    try {
      const convRes = await api.post('/conversations', { otherUserId: targetUserId });
      const conv = convRes.conversation;
      setCurrentConversation(conv);
      const msgRes = await api.get(`/conversations/${conv.id}/messages?limit=50&offset=0`);
      setMessages(processMessages(msgRes.messages || []));
      setHasMore(msgRes.hasMore);
      setUnreadCounts(prev => ({ ...prev, [`conv:${conv.id}`]: 0 }));
      
      // Instantly clear the unread_count in the sidebar's conversation list
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, unread_count: 0 } : c
      ));

      return conv;
    } catch (err) {
      console.error('Failed to initialize DM:', err);
      setMessages([]);
      throw err;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [processMessages]);

  /**
   * addMessage
   * Correctly matches incoming socket messages to the active view.
   */
  const addMessage = useCallback((message) => {
    console.log('[ChatContext] Incoming message:', {
      id: message.id,
      room_id: message.room_id,
      content: message.content?.substring(0, 30)
    });

    // Check against URL to be absolutely sure, as state might be lagging
    const urlRoomId = window.location.pathname.match(/\/dashboard\/rooms\/([^/]+)/)?.[1];

    const isCurrentRoom = message.room_id && 
      (currentRoom?.id === message.room_id || message.room_id === urlRoomId);
      
    const isCurrentConv = message.conversation_id && 
      currentConversation?.id === message.conversation_id;

    const processedMsg = {
      ...message,
      isOwn: user && message.sender_id === user.id
    };

    if (isCurrentRoom || isCurrentConv) {
      console.log('[ChatContext] Adding message to active view');
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, { ...processedMsg, isNew: true }];
      });
      // Clear unread for current view just in case
      const key = message.room_id ? `room:${message.room_id}` : `conv:${message.conversation_id}`;
      setUnreadCounts(prev => ({ ...prev, [key]: 0 }));
    } else {
      // Background message - track unread
      const key = message.room_id ? `room:${message.room_id}` : `conv:${message.conversation_id}`;
      console.log(`[ChatContext] Background message for ${key}, updating unread`);
      setUnreadCounts(prev => ({
        ...prev,
        [key]: (prev[key] || 0) + 1
      }));
      
      // Update the unread count in the local conversations list for the sidebar
      if (message.conversation_id) {
        setConversations(prev => prev.map(c => 
          c.id === message.conversation_id ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c
        ));
      }
    }
  }, [currentRoom, currentConversation, user]);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;

      // Special handling for read receipt updates
      if (updates.newReaderId) {
        const currentReaders = m.read_by ? m.read_by.split(',') : [];
        if (!currentReaders.includes(updates.newReaderId)) {
          return {
            ...m,
            read_by: [...currentReaders, updates.newReaderId].join(','),
            is_read: (m.is_read || 0) + 1
          };
        }
        return m;
      }

      return { ...m, ...updates };
    }));
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, is_deleted: 1, content: 'This message was deleted' } : m
    ));
  }, []);

  const setTyping = useCallback((contextId, userId, username, isTyping) => {
    setTypingUsers(prev => {
      const updated = { ...prev };
      const key = `${contextId}:${userId}`;
      if (isTyping) updated[key] = { userId, username, contextId };
      else delete updated[key];
      return updated;
    });
  }, []);

  const updatePresence = useCallback((userId, status, user) => {
    setOnlineUsers(prev => {
      const updated = { ...prev };
      if (status === 'online') updated[userId] = user || { id: userId };
      else delete updated[userId];
      return updated;
    });
  }, []);

  const updateOnlineUsersList = useCallback((users) => {
    const map = {};
    users.forEach(u => { map[u.id] = u; });
    setOnlineUsers(map);
  }, []);

  const addRoomMember = useCallback((roomId, user) => {
    if (currentRoom?.id === roomId) {
      setCurrentRoom(prev => prev ? { ...prev, member_count: (prev.member_count || 0) + 1 } : prev);
    }
  }, [currentRoom]);

  const removeRoomMember = useCallback((roomId, userId) => {
    if (currentRoom?.id === roomId) {
      setCurrentRoom(prev => prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 1) - 1) } : prev);
    }
  }, [currentRoom]);

  const setRoomMembers = useCallback((roomId, members) => {
    setRoomMembersState(members);
    if (roomId) {
      setRooms(prev => prev.map(r => 
        r.id === roomId ? { ...r, member_count: members.length } : r
      ));
      if (currentRoom?.id === roomId) {
        setCurrentRoom(prev => prev ? { ...prev, member_count: members.length } : prev);
      }
    }
  }, [currentRoom]);

  const clearChat = useCallback(() => {
    setCurrentRoom(null);
    setCurrentConversation(null);
    setMessages([]);
    setTypingUsers({});
  }, []);

  const value = React.useMemo(() => ({
    rooms, currentRoom, conversations, currentConversation, messages, roomMembers,
    onlineUsers, typingUsers, unreadCounts, isLoadingMessages, isLoadingMore, hasMore, 
    isUsersPanelOpen, isMobileSidebarOpen, isMobileMembersOpen,
    fetchRooms, fetchConversations, selectRoom, getOrCreateConversation, loadMoreMessages, setRoomMembers,
    addMessage, updateMessage, removeMessage, setTyping, updatePresence, toggleUsersPanel,
    toggleMobileSidebar, toggleMobileMembers,
    updateOnlineUsersList, addRoomMember, removeRoomMember, clearChat
  }), [
    rooms, currentRoom, conversations, currentConversation, messages, roomMembers,
    onlineUsers, typingUsers, unreadCounts, isLoadingMessages, isLoadingMore, hasMore, 
    isUsersPanelOpen, isMobileSidebarOpen, isMobileMembersOpen,
    fetchRooms, fetchConversations, selectRoom, getOrCreateConversation, loadMoreMessages, setRoomMembers,
    addMessage, updateMessage, removeMessage, setTyping, updatePresence, toggleUsersPanel,
    toggleMobileSidebar, toggleMobileMembers,
    updateOnlineUsersList, addRoomMember, removeRoomMember, clearChat
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
