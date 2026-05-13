import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = () => {
  const { roomId, userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const {
    currentRoom,
    currentConversation,
    messages,
    isLoadingMessages,
    onlineUsers,
    selectRoom,
    getOrCreateConversation,
    clearChat
  } = useChat();

  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [loadError, setLoadError] = useState(null);
  const lastTargetRef = useRef(null);

  const isRoom = !!roomId;
  const isDM = !!userId;

  const contextId = isRoom ? roomId : (currentConversation?.id || null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const targetKey = roomId ? `room:${roomId}` : userId ? `dm:${userId}` : null;
    if (!targetKey || lastTargetRef.current === targetKey) return;
    
    console.log(`[ChatWindow] Target changed to ${targetKey}, initializing...`);
    lastTargetRef.current = targetKey;
    setLoadError(null);
    clearChat(); // Clear previous messages immediately on target change

    const initChat = async () => {
      if (roomId) {
        selectRoom(roomId, socket);
      } else if (userId) {
        try {
          await getOrCreateConversation(userId);
        } catch (err) {
          console.error('[ChatWindow] Failed to init DM:', err);
          setLoadError('Could not start conversation');
        }
      }
    };

    initChat();

    return () => {
      clearChat();
    };
  }, [roomId, userId, selectRoom, getOrCreateConversation, socket, clearChat]);

  const notificationHandlerRef = useRef(null);
  notificationHandlerRef.current = { user, roomId, userId };

  // --- TAB NOTIFICATIONS ---
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      const { user: u, roomId: rid, userId: uid } = notificationHandlerRef.current;
      // Only notify if: tab hidden AND not my own message AND message is for current view
      const isForCurrentRoom = rid && msg.room_id === rid;
      const isForCurrentDM = uid && msg.sender_id === uid;

      if (document.hidden && msg.sender_id !== u.id && (isForCurrentRoom || isForCurrentDM)) {
        document.title = `(1) New Message | Convo`;
      }
    };

    const handleFocus = () => {
      document.title = 'Convo — Real-time Chat';
    };

    socket.on('receive_message', handleNewMessage);
    window.addEventListener('focus', handleFocus);

    return () => {
      socket.off('receive_message', handleNewMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [socket]); // Only re-attach if socket changes

  const handleEdit = useCallback((messageWithNewContent) => {
    if (!socket) return;
    socket.emit('edit_message', {
      messageId: messageWithNewContent.id,
      content: messageWithNewContent.content
    });
  }, [socket]);

  const handleDelete = useCallback((messageId) => {
    if (!socket) return;
    socket.emit('delete_message', { messageId });
  }, [socket]);

  if (loadError) {
    return (
      <div className="chat-window">
        <div className="chat-error">
          <span className="chat-error-icon">⚠️</span>
          <span className="chat-error-text">{loadError}</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <ChatHeader
        isRoom={isRoom}
        room={isRoom ? currentRoom : null}
        conversation={isDM ? currentConversation : null}
        onlineUsers={onlineUsers}
        searchMatches={searchMatches}
        currentMatchIndex={currentMatchIndex}
        onSearchMatchesChange={setSearchMatches}
        onCurrentMatchChange={setCurrentMatchIndex}
      />

      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        isRoom={isRoom}
        contextName={isRoom ? currentRoom?.name : currentConversation?.other_username}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchMatches={searchMatches}
        currentMatchIndex={currentMatchIndex}
      />

      <MessageInput
        isRoom={isRoom}
        roomId={isRoom ? roomId : null}
        conversationId={isDM ? contextId : null}
        placeholder={
          isRoom
            ? `Message #${currentRoom?.name || 'room'}`
            : `Message @${currentConversation?.other_username || 'user'}`
        }
      />
    </div>
  );
};

export default ChatWindow;
