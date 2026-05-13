import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import './MentionInput.css';

/**
 * MentionInput Component
 * 
 * An autocomplete wrapper for the message textarea.
 * Detects the '@' trigger and provides a user picker.
 */
const MentionInput = ({ value, onChange, onKeyDown, textareaRef, placeholder }) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(-1);

  const { onlineUsers } = useChat();

  const closeMentions = () => {
    setShowMentions(false);
    setMentionQuery('');
    setSelectedIndex(0);
    setMentionStartPos(-1);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Detect @ trigger before cursor
    const textBeforeCursor = val.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    // Only trigger if @ is at start or preceded by space
    const isStartOrSpace = atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ';

    if (atIndex !== -1 && isStartOrSpace) {
      const queryText = textBeforeCursor.substring(atIndex + 1);
      
      // Don't trigger if there's a space after @ before cursor
      if (!queryText.includes(' ') && queryText.length <= 20) {
        setMentionStartPos(atIndex);
        setMentionQuery(queryText);
        setShowMentions(true);
        
        // Filter from online users
        const results = Object.values(onlineUsers).filter(u => 
          u.username.toLowerCase().startsWith(queryText.toLowerCase())
        );
        setMentionResults(results);
        setSelectedIndex(0);
      } else {
        closeMentions();
      }
    } else {
      closeMentions();
    }

    // Pass event back to parent MessageInput
    onChange(e);
  };

  const insertMention = (username) => {
    const before = value.substring(0, mentionStartPos);
    // Find the end of the current "mention" word to replace it
    const after = value.substring(textareaRef.current.selectionStart);
    
    const newValue = `${before}@${username} ${after}`;
    
    // Simulate an event to update parent state
    const event = {
      target: { value: newValue }
    };
    onChange(event);
    closeMentions();

    // Reset focus and cursor
    setTimeout(() => {
      const newPos = before.length + username.length + 2;
      textareaRef.current?.setSelectionRange(newPos, newPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % mentionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[selectedIndex].username);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentions();
        return;
      }
    }

    // Forward other keys to parent
    onKeyDown?.(e);
  };

  return (
    <div className="mention-input-wrapper">
      {showMentions && mentionResults.length > 0 && (
        <div className="mention-dropdown animate-fadeUp">
          {mentionResults.map((u, i) => (
            <div
              key={u.id}
              className={`mention-item ${i === selectedIndex ? 'active' : ''}`}
              onClick={() => insertMention(u.username)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="mention-avatar">
                {u.avatar ? <img src={u.avatar} alt="" /> : u.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="mention-username">{u.username}</span>
              {onlineUsers[u.id] && <span className="mention-online-dot"></span>}
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="message-textarea"
        rows={1}
      />
    </div>
  );
};

export default MentionInput;
