import React from 'react';
import './MentionHighlight.css';

/**
 * MentionHighlight Component
 * 
 * Parses text and wraps @mentions in a styled span.
 */
const MentionHighlight = ({ text }) => {
  if (!text) return null;

  // Split by @mention pattern but keep the delimiters
  const parts = text.split(/(@\w+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span key={i} className="mention-highlight" title={`Mention: ${part}`}>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default MentionHighlight;
