import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import RoomSettingsModal from './RoomSettingsModal';
import { FILE_URL } from '../services/api';
import './ChatHeader.css';

const ChatHeader = ({
  isRoom,
  room,
  conversation,
  onlineUsers,
  searchMatches,
  currentMatchIndex,
  onSearchMatchesChange,
  onCurrentMatchChange
}) => {
  const { 
    messages, 
    toggleUsersPanel, isUsersPanelOpen, 
    toggleMobileSidebar, toggleMobileMembers 
  } = useChat();
  const { user } = useAuth();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  /**
   * SEARCH LOGIC
   * Filters current messages based on query and coordinates with ChatWindow state.
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      onSearchMatchesChange([]);
      onCurrentMatchChange(-1);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matching = messages
      .filter(m => !m.is_deleted && m.content?.toLowerCase().includes(q))
      .map(m => m.id);
    
    onSearchMatchesChange(matching);
    onCurrentMatchChange(matching.length > 0 ? 0 : -1);
  }, [searchQuery, messages, onSearchMatchesChange, onCurrentMatchChange]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      onSearchMatchesChange([]);
      onCurrentMatchChange(-1);
    }
  }, [isSearchOpen, onSearchMatchesChange, onCurrentMatchChange]);

  /**
   * SCROLL TO MESSAGE
   * Dispatches a custom event when the current match index changes.
   */
  useEffect(() => {
    if (currentMatchIndex >= 0 && searchMatches[currentMatchIndex]) {
      const event = new CustomEvent('scrollToMessage', {
        detail: { messageId: searchMatches[currentMatchIndex] }
      });
      window.dispatchEvent(event);
    }
  }, [currentMatchIndex, searchMatches]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onCurrentMatchChange(prev => (prev > 0 ? prev - 1 : searchMatches.length - 1));
      } else {
        onCurrentMatchChange(prev => (prev < searchMatches.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const renderSearchBar = () => (
    <div className="header-search-bar">
      <span className="header-search-icon">🔍</span>
      <input
        ref={searchInputRef}
        type="text"
        className="header-search-input"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearchKeyDown}
      />
      {searchMatches.length > 0 && (
        <span className="header-search-count">
          {currentMatchIndex + 1} of {searchMatches.length}
        </span>
      )}
      {searchQuery && searchMatches.length === 0 && (
        <span className="header-search-count header-search-count--none">
          No results
        </span>
      )}
      <div className="header-search-nav">
        <button 
          className="search-nav-btn"
          onClick={() => onCurrentMatchChange(prev => (prev > 0 ? prev - 1 : searchMatches.length - 1))}
          disabled={searchMatches.length === 0}
          title="Previous match (Shift + Enter)"
        >↑</button>
        <button 
          className="search-nav-btn"
          onClick={() => onCurrentMatchChange(prev => (prev < searchMatches.length - 1 ? prev + 1 : 0))}
          disabled={searchMatches.length === 0}
          title="Next match (Enter)"
        >↓</button>
      </div>
      <button className="search-close-btn" onClick={() => setIsSearchOpen(false)}>✕</button>
    </div>
  );

  return (
    <div className="chat-header">
      <button className="mobile-hamburger" onClick={() => toggleMobileSidebar(true)} title="Menu">
        ☰
      </button>

      <div className="chat-header-left">
        {isSearchOpen ? (
          renderSearchBar()
        ) : isRoom ? (
          /* ROOM HEADER */
          <>
            <div className="chat-header-name">
              <span className="hash">#</span>
              {room?.name || 'Loading...'}
            </div>
            <div className="chat-header-subtitle desktop-only">
              <span className="subtitle-sep"></span>
              {room?.member_count || 0}{' '}
              {room?.member_count === 1 ? 'member' : 'members'}
              {room?.description && ` · ${room.description}`}
            </div>
            
            {/* Mobile Online Indicator */}
            <div className="mobile-online-indicator" onClick={() => toggleMobileMembers(true)}>
              <span className="status-dot-tiny status-dot-tiny--online"></span>
              <span className="online-count">{room?.member_count || 0}</span>
            </div>
          </>
        ) : (
          /* DM HEADER */
          <div className="dm-header-user">
            <div className="dm-header-avatar">
              {conversation?.other_avatar ? (
                <img 
                  src={conversation.other_avatar.startsWith('/uploads') ? `${FILE_URL}${conversation.other_avatar}` : conversation.other_avatar} 
                  alt="" 
                />
              ) : (
                conversation?.other_username?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <div className="dm-header-info">
              <div className="chat-header-name">
                {conversation?.other_username || 'User'}
              </div>
              <div className="chat-header-subtitle">
                {onlineUsers[conversation?.other_user_id] ? (
                  <span className="status-text status-text--online">
                    <span className="status-dot-tiny status-dot-tiny--online"></span>
                    Active Now
                  </span>
                ) : (
                  <span className="status-text status-text--offline">
                    <span className="status-dot-tiny status-dot-tiny--offline"></span>
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-header-actions">
        {!isUsersPanelOpen && (
          <button 
            className={`header-action-btn ${isSearchOpen ? 'header-action-btn--active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search messages"
          >
            🔍
          </button>
        )}
        
        {isRoom && (
          <>
            <button 
              className={`header-action-btn ${isUsersPanelOpen ? 'header-action-btn--active' : ''}`}
              title="Room Members"
              onClick={toggleUsersPanel}
            >👥</button>
            <button 
              className={`header-action-btn ${isSettingsOpen ? 'header-action-btn--active' : ''}`}
              title="Room Settings"
              onClick={() => setIsSettingsOpen(true)}
            >⚙️</button>
          </>
        )}
      </div>

      {isSettingsOpen && (
        <RoomSettingsModal 
          room={room} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
};

export default ChatHeader;
