import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { FILE_URL } from '../services/api';
import EmptyState from './EmptyState';
import './UsersPanel.css';

/**
 * UsersPanel Component
 * 
 * Displays a real-time list of online participants. 
 * Clicking a user initiates or opens a private DM conversation.
 */
const UsersPanel = () => {
  const { 
    onlineUsers, roomMembers, currentRoom,
    isMobileMembersOpen, toggleMobileMembers 
  } = useChat();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // If we are in a room, show room members. Otherwise show global online users.
  let displayList = currentRoom 
    ? roomMembers.filter(m => m.id !== currentUser?.id)
    : Object.values(onlineUsers).filter(u => u.id !== currentUser?.id);

  // Sort: Online users first
  displayList = [...displayList].sort((a, b) => {
    const aOnline = !!onlineUsers[a.id];
    const bOnline = !!onlineUsers[b.id];
    if (aOnline === bOnline) return (a.username || '').localeCompare(b.username || '');
    return aOnline ? -1 : 1;
  });

  const isOnline = (userId) => !!onlineUsers[userId];

  const handleUserClick = (userId) => {
    navigate(`/dashboard/dm/${userId}`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMembersOpen && (
        <div className="mobile-members-overlay" onClick={() => toggleMobileMembers(false)} />
      )}
      
      <aside className={`users-panel glass ${isMobileMembersOpen ? 'users-panel--mobile-open' : ''}`}>
        {/* Mobile Handle / Close */}
        <button className="mobile-sheet-close" onClick={() => toggleMobileMembers(false)}>✕</button>
      {/* FIX 7: Clean single-line header */}
      <div className="users-panel-header">
        <h3 className="users-panel-title">
          {currentRoom ? 'ROOM MEMBERS' : 'ONLINE'}
        </h3>
        {displayList.length > 0 && (
          <span className="online-count-badge">{displayList.length}</span>
        )}
      </div>

      <div className="users-list-scroll scroll-area">
        <div className="presence-section">
          {displayList.length > 0 ? (
            displayList.map(user => (
              <div 
                key={user.id} 
                className="user-item" 
                onClick={() => handleUserClick(user.id)}
              >
                <div className="user-avatar-stack">
                  <div className="avatar-sm">
                    {user.avatar ? (
                      <img 
                        src={user.avatar.startsWith('/uploads') ? `${FILE_URL}${user.avatar}` : user.avatar} 
                        alt="" 
                      />
                    ) : (
                      (user.username?.charAt(0)?.toUpperCase() || '?')
                    )}
                  </div>
                  <span className={`status-indicator ${isOnline(user.id) ? 'online' : 'offline'}`}></span>
                </div>
                <span className="user-name">{user.username}</span>
                <span className="user-action-hint">DM</span>
              </div>
            ))
          ) : (
            /* FIX 8: Polished empty state */
            <EmptyState 
              icon="👤" 
              title={currentRoom ? "No members" : "No users"} 
              description={currentRoom ? "Just you here" : "Others will appear when online"} 
              compact={true}
            />
          )}
        </div>
      </div>
      </aside>
    </>
  );
};

export default UsersPanel;
