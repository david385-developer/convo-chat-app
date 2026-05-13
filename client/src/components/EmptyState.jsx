import React from 'react';
import './EmptyState.css';

/**
 * EmptyState - A reusable component to show placeholders when no content is present.
 * Used in MessageList for both Room and DM modes with different icons/text.
 */
const EmptyState = ({ icon = '📭', title, description, compact = false }) => {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}>
      <span className="empty-state-icon">{icon}</span>
      {title && <span className="empty-state-title">{title}</span>}
      {description && <span className="empty-state-desc">{description}</span>}
    </div>
  );
};

export default EmptyState;
