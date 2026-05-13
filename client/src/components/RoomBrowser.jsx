import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import './RoomBrowser.css';

/**
 * RoomBrowser
 * A dedicated view for exploring and joining public rooms.
 */
const RoomBrowser = ({ onClose }) => {
  const { rooms: myRooms, fetchRooms } = useChat();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState(null);

  /**
   * Fetch all rooms on mount
   */
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setAllRooms(res.rooms || []);
        setFilteredRooms(res.rooms || []);
      } catch (err) {
        console.error('[RoomBrowser] Failed to load rooms:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRooms();
  }, []);

  /**
   * Real-time search filter
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(allRooms);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredRooms(allRooms.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      ));
    }
  }, [searchQuery, allRooms]);

  const isMember = (roomId) => myRooms.some(r => r.id === roomId);

  const handleJoin = async (roomId) => {
    setJoiningRoomId(roomId);
    try {
      await api.post(`/rooms/${roomId}/join`);

      // Notify server via socket
      if (socket) {
        socket.emit('join_room', { roomId });
      }

      // Refresh sidebar list
      await fetchRooms();

      // Move to room
      onClose?.();
      navigate(`/dashboard/rooms/${roomId}`);
    } catch (err) {
      console.error('[RoomBrowser] Join failed:', err);
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleOpen = (roomId) => {
    onClose?.();
    navigate(`/dashboard/rooms/${roomId}`);
  };

  return (
    <div className="room-browser">
      {/* Header Section */}
      <div className="room-browser-header">
        <div className="room-browser-top">
          <button className="room-browser-back" onClick={() => { onClose?.(); navigate('/dashboard'); }}>
            ← Back
          </button>
          <h2>Browse Rooms</h2>
        </div>
        <p className="room-browser-subtitle">
          Find and join public conversations across the platform.
        </p>
        
        {/* Search Bar */}
        <div className="room-browser-search">
          <span className="rb-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search rooms by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rb-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      </div>

      {/* Results Meta */}
      {!isLoading && (
        <div className="room-browser-count">
          {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} found
        </div>
      )}

      {/* Rooms Grid */}
      <div className="room-browser-grid">
        {isLoading ? (
          // Skeleton Loading State
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="room-card room-card--skeleton">
              <div className="skeleton-line skeleton-line--title"></div>
              <div className="skeleton-line skeleton-line--desc"></div>
              <div className="skeleton-line skeleton-line--meta"></div>
            </div>
          ))
        ) : filteredRooms.length === 0 ? (
          // Empty State
          <div className="room-browser-empty">
            <span className="rb-empty-icon">🏗️</span>
            <span className="rb-empty-title">
              {searchQuery ? `No rooms found for "${searchQuery}"` : 'No rooms yet'}
            </span>
            <span className="rb-empty-desc">
              {searchQuery ? 'Try a different search term or browse existing ones.' : 'Be the first to create a public room!'}
            </span>
          </div>
        ) : (
          // Active List
          filteredRooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <span className="room-card-hash">#</span>
                <span className="room-card-name">{room.name}</span>
              </div>
              <p className="room-card-desc">
                {room.description || 'No description provided for this room.'}
              </p>
              <div className="room-card-footer">
                <span className="room-card-members">
                  👥 {room.member_count || 0} {room.member_count === 1 ? 'member' : 'members'}
                </span>
                {isMember(room.id) ? (
                  <button
                    className="room-card-btn room-card-btn--open"
                    onClick={() => handleOpen(room.id)}
                  >
                    Open
                  </button>
                ) : (
                  <button
                    className="room-card-btn room-card-btn--join"
                    onClick={() => handleJoin(room.id)}
                    disabled={joiningRoomId === room.id}
                  >
                    {joiningRoomId === room.id ? (
                      <span className="btn-spinner-sm"></span>
                    ) : (
                      'Join'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomBrowser;
