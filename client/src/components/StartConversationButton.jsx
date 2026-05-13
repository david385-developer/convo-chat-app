import React from 'react';
import './StartConversationButton.css';

/**
 * StartConversationButton
 * Simple trigger that calls the provided onClick handler to open the search modal.
 */
const StartConversationButton = ({ onClick }) => {
  return (
    <button className="sidebar-new-message-btn" onClick={onClick} title="Start a new conversation">
      <span className="new-msg-icon">✉</span>
      <span>New Message</span>
    </button>
  );
};

export default StartConversationButton;
