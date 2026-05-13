import React from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import './TypingIndicator.css';

const TypingIndicator = () => {
  const { typingUsers, currentRoom, currentConversation } = useChat();
  const { user } = useAuth();

  // Determine current context for filtering typing users
  const isRoom = !!currentRoom;
  const currentContextId = isRoom
    ? `room:${currentRoom?.id}`
    : `conv:${currentConversation?.id}`;

  // Filter typing users for this specific context, excluding the current user
  const typingHere = Object.values(typingUsers).filter(t =>
    t.contextId === currentContextId && t.userId !== user?.id
  );

  if (typingHere.length === 0) return null;

  /**
   * BUILD DISPLAY TEXT
   * Adapts text based on number of people typing.
   */
  let text;
  if (typingHere.length === 1) {
    // Single person (common in DMs or quiet rooms)
    text = `${typingHere[0].username} is typing`;
  } else if (typingHere.length === 2) {
    // Two people in a room
    text = `${typingHere[0].username} and ${typingHere[1].username} are typing`;
  } else {
    // Many people in a room
    text = `${typingHere[0].username} and ${typingHere.length - 1} others are typing`;
  }

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span className="typing-text">{text}</span>
    </div>
  );
};

export default TypingIndicator;
