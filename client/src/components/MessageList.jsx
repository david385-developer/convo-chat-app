import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

const MessageList = ({ 
  messages, 
  isLoading, 
  isRoom, 
  contextName,
  onEdit, 
  onDelete,
  searchMatches,
  currentMatchIndex
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { currentRoom, currentConversation, loadMoreMessages, hasMore, isLoadingMore } = useChat();
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  // Preserve scroll height before prepending messages
  const lastScrollHeightRef = useRef(0);

  /**
   * HANDLE SCROLL (Infinite Scroll)
   */
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    // If we are near the top, load more
    if (container.scrollTop < 100) {
      console.log('[MessageList] Near top, loading more...');
      lastScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }

    // Toggle "New messages" button visibility
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      setShowNewMessages(false);
      setIsScrollingUp(false);
    } else {
      setIsScrollingUp(true);
    }
  }, [isLoadingMore, hasMore, loadMoreMessages]);

  // Maintain scroll position after loading more
  useEffect(() => {
    if (!isLoadingMore && lastScrollHeightRef.current > 0 && containerRef.current) {
      const container = containerRef.current;
      const addedHeight = container.scrollHeight - lastScrollHeightRef.current;
      container.scrollTop = addedHeight;
      lastScrollHeightRef.current = 0;
    }
  }, [isLoadingMore]);

  /**
   * GROUP MESSAGES
   * Logic to determine bubbles' visual grouping (first/last in group) and date separators.
   */
  const groupedMessages = useMemo(() => {
    if (!messages?.length) return [];

    return messages.map((msg, index) => {
      const prev = messages[index - 1];
      const next = messages[index + 1];

      // Groups are defined by: same sender AND within 5 minutes
      const isFirstInGroup = !prev ||
        prev.sender_id !== msg.sender_id ||
        (new Date(msg.created_at) - new Date(prev.created_at)) > 5 * 60 * 1000;

      const isLastInGroup = !next ||
        next.sender_id !== msg.sender_id ||
        (new Date(next.created_at) - new Date(msg.created_at)) > 5 * 60 * 1000;

      const isOwn = msg.sender_id === user?.id;

      const showDateSeparator = !prev ||
        new Date(msg.created_at).toDateString() !==
        new Date(prev.created_at).toDateString();

      return {
        ...msg,
        isFirstInGroup,
        isLastInGroup,
        isOwn,
        showDateSeparator
      };
    });
  }, [messages, user]);

  /**
   * READ RECEIPTS
   * Mark messages as read when the conversation or room is viewed.
   */
  useEffect(() => {
    if (!socket || !user || !messages.length) return;

    // Use current context IDs
    const currentId = isRoom ? currentRoom?.id : currentConversation?.id;
    if (!currentId) return;

    const unreadMessages = messages.filter(m => {
      if (m.sender_id === user.id) return false;
      if (isRoom) {
        // If user ID is not in the comma-separated read_by string
        const readers = m.read_by ? m.read_by.split(',') : [];
        return !readers.includes(user.id);
      } else {
        // If is_read count is 0 (for DMs)
        return !m.is_read;
      }
    });

    if (unreadMessages.length > 0) {
      console.log(`[MessageList] Marking ${unreadMessages.length} messages as read`);
      socket.emit('messages_read', {
        messageIds: unreadMessages.map(m => m.id),
        roomId: isRoom ? currentId : null,
        conversationId: !isRoom ? currentId : null
      });
    }
  }, [messages, currentRoom, currentConversation, socket, user, isRoom]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && !isLoadingMore && messages.length > 0 && !isScrollingUp) {
      scrollToBottom(false);
    }
  }, [isLoading, messages.length, scrollToBottom, isLoadingMore, isScrollingUp]);

  // On new message: auto-scroll if near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading || isLoadingMore) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;

    if (isNearBottom) {
      scrollToBottom(true);
      setShowNewMessages(false);
    } else if (messages.length > 0 && !isScrollingUp) {
      setShowNewMessages(true);
    }
  }, [messages.length, isLoading, isLoadingMore, scrollToBottom, isScrollingUp]);

  /**
   * LISTEN FOR SCROLL TO MESSAGE
   * Triggered by search matches in the header.
   */
  useEffect(() => {
    const handleScrollTo = (e) => {
      const el = document.getElementById(`msg-${e.detail.messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('scrollToMessage', handleScrollTo);
    return () => window.removeEventListener('scrollToMessage', handleScrollTo);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', {
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const emptyIcon = isRoom ? '💬' : '👋';
  const emptyTitle = isRoom ? 'No messages yet' : `Start a conversation`;
  const emptyDesc = isRoom
    ? 'Say hello to the room!'
    : `Send a message to ${contextName || 'this user'}`;

  return (
    <div className="messages-list" ref={containerRef} onScroll={handleScroll}>
      {isLoadingMore && (
        <div className="messages-load-more">
          <div className="spinner-sm"></div>
          <span>Loading previous messages...</span>
        </div>
      )}
      {isLoading ? (
        /* LOADING SKELETON */
        <div className="messages-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-message" style={{
              justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end'
            }}>
              <div className="skeleton-bubble" style={{
                width: 120 + (i * 20) % 180 + 'px'
              }}></div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        /* EMPTY STATE */
        <div className="empty-messages">
          <span className="empty-messages-icon">{emptyIcon}</span>
          <span className="empty-messages-title">{emptyTitle}</span>
          <span className="empty-messages-desc">{emptyDesc}</span>
        </div>
      ) : (
        /* RENDER MESSAGES */
        groupedMessages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.showDateSeparator && (
              <div className="date-separator">
                {formatDate(msg.created_at)}
              </div>
            )}
            <MessageBubble
              message={msg}
              isOwn={msg.isOwn}
              isFirstInGroup={msg.isFirstInGroup}
              isLastInGroup={msg.isLastInGroup}
              isRoom={isRoom}
              isSearchMatch={searchMatches.includes(msg.id)}
              isCurrentMatch={
                currentMatchIndex >= 0 &&
                searchMatches[currentMatchIndex] === msg.id
              }
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </React.Fragment>
        ))
      )}

      <TypingIndicator />
      <div ref={messagesEndRef} style={{ height: '1px' }} />

      {showNewMessages && (
        <button className="new-messages-btn" onClick={() => {
          scrollToBottom();
          setShowNewMessages(false);
        }}>
          New messages ↓
        </button>
      )}
    </div>
  );
};

export default MessageList;
