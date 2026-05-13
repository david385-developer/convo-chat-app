import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useChat, useNotification } from '../context';
import { useSocket } from '../context/SocketContext';
import useSocketEvents from '../hooks/useSocketEvents';
import { api, FILE_URL } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import NotificationToast from '../components/NotificationToast';
import UsersPanel from '../components/UsersPanel';
import SearchModal from '../components/SearchModal';
import CreateRoomModal from '../components/CreateRoomModal';
import StartConversationButton from '../components/StartConversationButton';
import RoomBrowser from '../components/RoomBrowser';
import EmptyState from '../components/EmptyState';
import './DashboardLayout.css';

/**
 * DashboardLayout Component
 * 
 * Orchestrates the 3-column layout and global UI states.
 * Refined Sidebar with compact spacing and multi-entity search.
 */
const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { 
    rooms, fetchRooms, 
    conversations, fetchConversations,
    unreadCounts, onlineUsers, typingUsers, isUsersPanelOpen,
    isMobileSidebarOpen, toggleMobileSidebar,
    isMobileMembersOpen, toggleMobileMembers
  } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change, but open it if on root dashboard (mobile)
  useEffect(() => {
    const isDashboardRoot = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    const isMobile = window.innerWidth <= 767;

    if (isDashboardRoot && isMobile) {
      toggleMobileSidebar(true);
    } else {
      toggleMobileSidebar(false);
    }
  }, [location.pathname, toggleMobileSidebar]);

  // Global UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [allUsers, setAllUsers] = useState([]);

  // Register real-time listeners
  useSocketEvents();

  useEffect(() => {
    fetchRooms();
    fetchConversations();
    
    // FIX 5: Fetch users for sidebar search results
    const fetchUsers = async () => {
      try {
        const res = await api.get('/search?q=&type=users');
        setAllUsers(res.results?.users || []);
      } catch (err) {
        console.error('Failed to fetch users for sidebar search:', err);
      }
    };
    fetchUsers();
  }, [fetchRooms, fetchConversations]);

  const handleNewMessage = () => {
    setSearchFilter('users');
    setIsSearchOpen(true);
  };

  // Handle Command+K for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // FIX 5: Sidebar Search Filtering
  const filteredRooms = searchQuery.trim()
    ? rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rooms;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.other_username?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Search users that don't have an active conversation already (and are not self)
  const conversationUserIds = new Set(conversations.map(c => c.other_user_id));
  const filteredUsers = searchQuery.trim().length >= 2
    ? allUsers.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) && 
        u.id !== user.id &&
        !conversationUserIds.has(u.id)
      )
    : [];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    // Ensure the date is parsed as UTC if the backend didn't append 'Z'
    const validDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const date = new Date(validDateStr);
    
    // Check if it's from today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If it's an older date, return month and day
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`dashboard-layout animate-fadeIn ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
      {!isConnected && (
        <div className="disconnect-banner">
          <span className="pulse-dot"></span>
          Connection lost. Reconnecting...
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay" 
          onClick={() => toggleMobileSidebar(false)}
        />
      )}

      {/* COLUMN 1: SIDEBAR */}
      <aside className={`sidebar glass ${isMobileSidebarOpen ? 'sidebar--mobile-open' : ''}`}>
        {/* Profile Card */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img 
                  src={user.avatar.startsWith('/uploads') ? `${FILE_URL}${user.avatar}` : user.avatar} 
                  alt={user.username} 
                />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-info">
              <span className="username">{user?.username}</span>
              <span className="status-label">Online</span>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Sidebar Search */}
        <div className="sidebar-search">
          <span className="sidebar-search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sidebar-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="sidebar-scroll scroll-area">
          {/* Section: Public Channels */}
          <div className="sidebar-section">
            <div className="section-header">
              <span>Public Channels</span>
              <div className="section-header-actions">
                <button 
                  className="btn-icon-sm" 
                  onClick={() => setIsCreateRoomOpen(true)} 
                  title="Create room"
                >+</button>
                <button 
                  className="btn-icon-sm" 
                  onClick={() => setIsBrowseOpen(true)} 
                  title="Browse rooms"
                >⊞</button>
              </div>
            </div>
            <div className="sidebar-list">
              {filteredRooms.map(room => (
                <NavLink 
                  key={room.id} 
                  to={`/dashboard/rooms/${room.id}`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
                  onClick={() => { setIsBrowseOpen(false); setIsSearchOpen(false); }}
                >
                  <span className="item-icon">#</span>
                  <span className="item-name">{room.name}</span>
                  {unreadCounts[`room:${room.id}`] > 0 && (
                    <span className="unread-badge">{unreadCounts[`room:${room.id}`]}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Section: Direct Messages */}
          <div className="sidebar-section">
            <div className="section-header">
              <span>Direct Messages</span>
            </div>
            <div className="sidebar-list">
              <StartConversationButton onClick={handleNewMessage} />

              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => {
                  const isOnline = !!onlineUsers[conv.other_user_id];
                  const isTyping = Object.values(typingUsers).some(t => t.contextId === `conv:${conv.id}` && t.userId !== user?.id);

                  return (
                    <NavLink 
                      key={conv.id} 
                      to={`/dashboard/dm/${conv.other_user_id}`}
                      className={({ isActive }) => `sidebar-item sidebar-item--dm ${isActive ? 'sidebar-item--active' : ''}`}
                      onClick={() => { setIsBrowseOpen(false); setIsSearchOpen(false); }}
                    >
                      <div className="item-avatar">
                        {conv.other_avatar ? (
                          <img 
                            src={conv.other_avatar.startsWith('/uploads') ? `${FILE_URL}${conv.other_avatar}` : conv.other_avatar} 
                            alt="" 
                          />
                        ) : (
                          <div className="avatar-fallback">{conv.other_username?.charAt(0)?.toUpperCase()}</div>
                        )}
                        <span className={`status-dot ${isOnline ? 'status-dot--online' : 'status-dot--offline'}`}></span>
                      </div>
                      <div className="item-info">
                        <div className="dm-meta-top">
                          <span className="item-name">{conv.other_username}</span>
                          <span className="dm-time">{formatTime(conv.last_message_at)}</span>
                        </div>
                        <div className="dm-meta-bottom">
                          {isTyping ? (
                            <span className="item-preview typing-indicator-sidebar" style={{ color: '#10b981', fontStyle: 'italic', fontWeight: '500' }}>
                              typing...
                            </span>
                          ) : conv.last_message_content ? (
                            <span className="item-preview">
                              {conv.last_message_content.substring(0, 30)}
                              {conv.last_message_content.length > 30 ? '...' : ''}
                            </span>
                          ) : (
                            <span className="item-preview italic">No messages yet</span>
                          )}
                          {(conv.unread_count > 0 || unreadCounts[`conv:${conv.id}`] > 0) && (
                            <span className="unread-badge">
                              {(conv.unread_count || 0) + (unreadCounts[`conv:${conv.id}`] || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </NavLink>
                  );
                })
              ) : (
                !searchQuery && (
                  <EmptyState 
                    icon="💬" 
                    title="No active chats" 
                    description="Start a conversation" 
                    compact={true}
                  />
                )
              )}
            </div>
          </div>

          {/* FIX 5: Dynamic User Search Results */}
          {filteredUsers.length > 0 && (
            <div className="sidebar-section">
              <div className="section-header">
                <span>USERS FOUND</span>
              </div>
              <div className="sidebar-list">
                {filteredUsers.map(u => (
                  <NavLink
                    key={u.id}
                    to={`/dashboard/dm/${u.id}`}
                    className="sidebar-item"
                    onClick={() => setSearchQuery('')}
                  >
                    <div className="item-avatar">
                      <div className="avatar-fallback">{u.username?.charAt(0)?.toUpperCase()}</div>
                      <span className={`status-dot ${onlineUsers[u.id] ? 'status-dot--online' : 'status-dot--offline'}`}></span>
                    </div>
                    <span className="item-name">{u.username}</span>
                    <span className="item-hint">Message</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="logout-icon">⏻</span>
            Log out
          </button>
        </div>
      </aside>

      {/* COLUMN 2: MAIN CHAT AREA */}
      <main className={`dashboard-content ${!isUsersPanelOpen ? 'dashboard-content--full' : ''}`}>
        {/* Mobile Header (Shown only on dashboard root for mobile) */}
        {(location.pathname === '/dashboard' || location.pathname === '/dashboard/') && (
          <header className="dashboard-mobile-header">
            <button className="mobile-hamburger" onClick={() => toggleMobileSidebar(true)}>
              ☰
            </button>
            <div className="mobile-logo">Convo<span>.</span></div>
            <div className="mobile-header-actions">
              <NotificationBell />
            </div>
          </header>
        )}

        {isBrowseOpen ? (
          <RoomBrowser onClose={() => setIsBrowseOpen(false)} />
        ) : (
          <Outlet />
        )}
      </main>

      {/* COLUMN 3: USERS PANEL */}
      {isUsersPanelOpen && <UsersPanel />}

      {/* GLOBAL OVERLAYS */}
      <NotificationToast />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => { setIsSearchOpen(false); setSearchFilter('all'); }} 
        initialFilter={searchFilter}
      />
      <CreateRoomModal isOpen={isCreateRoomOpen} onClose={() => setIsCreateRoomOpen(false)} />

      {/* Keyboard Hint */}
      {!isUsersPanelOpen && (
        <div className="keyboard-hint desktop-only">
          <span>Quick Search</span>
          <kbd>⌘</kbd> <kbd>K</kbd>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
