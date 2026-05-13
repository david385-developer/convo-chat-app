import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useChat } from '../context/ChatContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

/**
 * SIDEBAR COMPONENT
 * Implements a high-fidelity workspace navigation with glass-morphism,
 * dynamic status indicators, and conversational previews.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const { rooms, conversations, setActiveChat, onlineUsers, unreadCounts } = useChat();
  const { user } = useAuth();

  // Helper to generate a consistent gradient based on username
  const getAvatarGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #6c63ff 0%, #a29bfe 100%)',
      'linear-gradient(135deg, #00d4aa 0%, #22a6b3 100%)',
      'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)',
      'linear-gradient(135deg, #ffd93d 0%, #f9ca24 100%)',
      'linear-gradient(135deg, #686de0 0%, #4834d4 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const filteredRooms = rooms?.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) || [];
  const filteredDMs = conversations?.filter(d => d.username.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* 1. User Profile Card */}
      <div className="sidebar-profile">
        <div className="profile-main">
          <div className="p-avatar-circle" style={{ background: getAvatarGradient(user?.username || 'U') }}>
            {user?.avatar ? <img src={user.avatar} alt="Me" /> : (user?.username?.[0] || 'U')}
            <span className="p-status-glow"></span>
          </div>
          <div className="p-info">
            <span className="p-username">{user?.username}</span>
            <span className="p-status-text">● Online</span>
          </div>
        </div>
        <button className="settings-trigger" title="Settings">⚙️</button>
      </div>

      {/* 2. Search Workspace */}
      <div className="sidebar-search">
        <div className="search-input-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Navigation Areas */}
      <div className="sidebar-scroll-area">
        
        {/* Public Channels */}
        <div className="sidebar-section">
          <div className="section-header">CHANNELS</div>
          <div className="section-list">
            {filteredRooms.map(room => (
              <SidebarItem 
                key={room.id}
                to={`/dashboard/rooms/${room.id}`} 
                icon="#" 
                name={room.name} 
                unread={unreadCounts[`room_${room.id}`]}
                onClick={() => setActiveChat({ ...room, type: 'room' })}
              />
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="sidebar-section">
          <div className="section-header">DIRECT MESSAGES</div>
          <div className="section-list">
            {filteredDMs.map(dm => (
              <SidebarItem 
                key={dm.id}
                to={`/dashboard/dm/${dm.id}`} 
                avatar={dm.username[0]}
                name={dm.username} 
                status={onlineUsers[dm.user_id] ? 'online' : 'offline'}
                msg={dm.last_message || "Start a conversation..."}
                time="12:30" 
                gradient={getAvatarGradient(dm.username)}
                unread={unreadCounts[`conv_${dm.id}`]}
                onClick={() => setActiveChat({ ...dm, type: 'private' })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Workspace Footer */}
      <div className="sidebar-footer">
        <button className="create-room-btn">
          Create New Room <span>+</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ to, icon, avatar, name, unread, status, msg, time, gradient, onClick }) => (
  <NavLink to={to} className="sidebar-item" onClick={onClick}>
    <div className="item-visual">
      {icon ? (
        <span className="item-icon">{icon}</span>
      ) : (
        <div className="item-avatar-wrapper">
          <div className="item-avatar" style={{ background: gradient }}>{avatar}</div>
          {status && <span className={`status-indicator ${status}`}></span>}
        </div>
      )}
    </div>
    <div className="item-content">
      <div className="item-top">
        <span className="item-name">{name}</span>
        {time && <span className="item-time">{time}</span>}
        {unread && <span className="unread-badge">{unread}</span>}
      </div>
      {msg && <p className="item-msg truncate">{msg}</p>}
    </div>
  </NavLink>
);

export default Sidebar;
