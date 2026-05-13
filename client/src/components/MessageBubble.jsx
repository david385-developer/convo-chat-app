import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import LinkPreview from './LinkPreview';
import { FILE_URL } from '../services/api';
import './MessageBubble.css';

/**
 * MentionHighlight - Sub-component to highlight @usernames in message content.
 */
const MentionHighlight = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="mention">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  );
};

const MessageBubble = ({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  isRoom,
  isSearchMatch,
  isCurrentMatch,
  onEdit,
  onDelete
}) => {
  const { user: currentUser } = useAuth();
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef(null);

  // --- HIGHLIGHT LOGIC ---
  useEffect(() => {
    if (message.isNew && !isOwn) {
      setIsNew(true);
      const timer = setTimeout(() => setIsNew(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message.isNew, isOwn]);

  const isMentioned = !isOwn && message.content?.includes(`@${currentUser?.username}`);

  /**
   * READ RECEIPTS
   * Only meaningful in DMs where there's exactly one recipient.
   * In rooms, tracking every reader is too expensive for this UI.
   */
  const renderReceipt = () => {
    if (!isOwn) return null;

    if (isRoom) {
      const readCount = message.read_by ? message.read_by.split(',').length : 0;
      if (readCount === 0) return null;
      return (
        <span className="message-receipt message-receipt--read" title={`Read by ${readCount} people`}>
          Seen by {readCount}
        </span>
      );
    }

    // DM Logic
    if (message.is_read > 0) {
      return <span className="message-receipt message-receipt--read" title="Read">✓✓</span>;
    }
    return <span className="message-receipt" title="Sent">✓</span>;
  };

  const startEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const submitEdit = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.({ ...message, content: trimmed });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const renderContent = () => {
    if (message.is_deleted) {
      return <em className="deleted-text">This message was deleted</em>;
    }

    switch (message.type) {
      case 'MARKDOWN':
        const mdUrlMatch = message.content.match(/https?:\/\/[^\s]+/);
        return (
          <>
            <MarkdownRenderer content={message.content} />
            {mdUrlMatch && <LinkPreview url={mdUrlMatch[0]} />}
          </>
        );
      case 'IMAGE':
        const imageUrl = message.media_url || message.content;
        const resolvedUrl = imageUrl.startsWith('/uploads') ? `${FILE_URL}${imageUrl}` : imageUrl;
        return (
          <img
            src={resolvedUrl}
            alt="Shared media"
            className="message-image"
            onClick={() => window.open(resolvedUrl, '_blank')}
          />
        );
      case 'LINK':
        return <LinkPreview url={message.content} />;
      default:
        // Try to detect URL in text for automatic preview
        const urlMatch = message.content.match(/https?:\/\/[^\s]+/);
        return (
          <>
            <MentionHighlight text={message.content} />
            {urlMatch && <LinkPreview url={urlMatch[0]} />}
          </>
        );
    }
  };

  const formatTime = (dateStr) => {
    // Ensure the date is parsed as UTC if the backend didn't append 'Z'
    const validDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    return new Date(validDateStr).toLocaleTimeString([], {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`message-row ${isOwn ? 'message-row--own' : 'message-row--other'}`}
      style={{ marginBottom: isLastInGroup ? '12px' : '2px' }}
    >
      {/* Avatar: Shown for others' messages, only on the last message in a group */}
      {!isOwn && (
        <div className="message-avatar-container">
          {isLastInGroup ? (
            <div className="message-avatar">
              {message.sender_avatar ? (
                <img 
                  src={message.sender_avatar.startsWith('/uploads') ? `${FILE_URL}${message.sender_avatar}` : message.sender_avatar} 
                  alt="" 
                />
              ) : (
                message.sender_username?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
          ) : (
            <div className="message-avatar-spacer" />
          )}
        </div>
      )}

      <div className="message-content-wrapper">
        {/* Sender name: Shown for others' messages, only on the first message in a group */}
        {!isOwn && isFirstInGroup && isRoom && (
          <div className="message-sender-name">
            {message.sender_username}
          </div>
        )}

        {/* Bubble */}
        <div className={`message-bubble ${
          isOwn ? 'message-bubble--own' : 'message-bubble--other'
        } ${message.is_deleted ? 'message-bubble--deleted' : ''}
        ${isSearchMatch ? 'message-bubble--search-match' : ''}
        ${isCurrentMatch ? 'message-bubble--current-match' : ''}
        ${isNew ? 'new-message' : ''}
        ${isMentioned ? 'mention' : ''}`}>

          {isEditing ? (
            <div className="message-edit-container">
              <textarea
                ref={editInputRef}
                className="message-edit-input"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={1}
              />
              <div className="message-edit-actions">
                <button className="edit-cancel-btn" onClick={cancelEdit}>Cancel</button>
                <button className="edit-save-btn" onClick={submitEdit}>Save</button>
              </div>
              <span className="edit-hint">Enter to save · Esc to cancel</span>
            </div>
          ) : (
            <div className="message-content">
              {renderContent()}
            </div>
          )}

          {/* Actions: Shown on hover for own non-deleted messages */}
          {isOwn && !message.is_deleted && !isEditing && (
            <div className="message-actions">
              <button className="message-action-btn" onClick={startEdit} title="Edit">✎</button>
              <button className="message-action-btn message-action-btn--danger"
                      onClick={() => onDelete?.(message.id)} title="Delete">🗑</button>
            </div>
          )}
        </div>

        {/* Meta: Timestamp and Receipts shown only on the last message of a group */}
        {isLastInGroup && !message.is_deleted && (
          <div className="message-meta">
            {message.is_edited === 1 && (
              <span className="message-edited">(edited)</span>
            )}
            <span className="message-timestamp">{formatTime(message.created_at)}</span>
            {renderReceipt()}
          </div>
        )}

        {/* Meta for deleted messages */}
        {isLastInGroup && message.is_deleted === 1 && (
          <div className="message-meta">
            <span className="message-timestamp">{formatTime(message.created_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
