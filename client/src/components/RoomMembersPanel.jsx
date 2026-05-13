import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat } from '../context';
import api from '../services/api';
import './RoomMembersPanel.css';

/**
 * RoomMembersPanel Component
 * 
 * A slide-in drawer that displays all members of the current room.
 * Supports online status tracking and quick DM initiation.
 */
const RoomMembersPanel = ({ isOpen, onClose, roomId, roomName }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useChat();
  const navigate = useNavigate();

  // 1. Fetch members when panel opens
  useEffect(() => {
    if (isOpen && roomId) {
      setIsLoading(true);
      api.get(`/rooms/${roomId}/members`)
        .then(res => {
          setMembers(res.members || []);
        })
        .catch(err => {
          console.error('Failed to fetch room members:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, roomId]);

  // 2. Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // 3. Sort members: Online first, then Admins, then Alphabetical
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aOnline = !!onlineUsers[a.id];
      const bOnline = !!onlineUsers[b.id];
      if (aOnline !== bOnline) return bOnline - aOnline;

      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;

      return (a.username || '').localeCompare(b.username || '');
    });
  }, [members, onlineUsers]);

  const handleMessage = (memberId) => {
    onClose();
    navigate(`/dashboard/dm/${memberId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="members-panel-overlay" onClick={onClose}>
      <div className="members-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="members-panel-header">
          <div className="members-panel-title">
            <span className="members-panel-room">
              <span className="hash">#</span> {roomName}
            </span>
            <span className="members-panel-count">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          <button className="members-panel-close" onClick={onClose} title="Close panel">✕</button>
        </div>

        {/* Member List */}
        <div className="members-panel-list scroll-area">
          {isLoading ? (
            <div className="members-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="member-skeleton">
                  <div className="member-skeleton-avatar"></div>
                  <div className="member-skeleton-info">
                    <div className="member-skeleton-name"></div>
                    <div className="member-skeleton-status"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="members-empty">No members found</div>
          ) : (
            sortedMembers.map(member => {
              const isOnline = !!onlineUsers[member.id];
              const isCurrentUser = member.id === currentUser?.id;
              const isAdmin = member.role === 'admin';

              return (
                <div key={member.id} className="member-item">
                  <div className="member-avatar-wrapper">
                    <div className="member-avatar">
                      {member.avatar
                        ? <img src={member.avatar} alt="" />
                        : (member.username?.charAt(0)?.toUpperCase() || '?')
                      }
                    </div>
                    <span className={`status-dot status-dot--${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  
                  <div className="member-info">
                    <div className="member-name-row">
                      <span className="member-name">{member.username}</span>
                      {isCurrentUser && <span className="member-you">(You)</span>}
                      {isAdmin && <span className="member-admin-badge">Admin</span>}
                    </div>
                    <span className="member-status">
                      {isOnline ? 'Active now' : 'Offline'}
                    </span>
                  </div>

                  {!isCurrentUser && (
                    <button 
                      className="member-msg-btn"
                      onClick={() => handleMessage(member.id)}
                      title={`Message ${member.username}`}
                    >
                      ✉
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomMembersPanel;
