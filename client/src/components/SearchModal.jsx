import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { useDebounce } from '../hooks/useDebounce';
import api, { FILE_URL } from '../services/api';
import Modal from './Modal';
import './SearchModal.css';

/**
 * SearchModal Component
 * 
 * A command-palette style search interface triggered by Cmd+K.
 * Handles unified searching for users and rooms.
 */
const SearchModal = ({ isOpen, onClose, initialFilter = 'all' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], rooms: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { fetchRooms } = useChat();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // 1. Handle keyboard shortcuts (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 2. Focus and Reset
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ users: [], rooms: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 3. Debounced Search Execution
  const debouncedSearch = useDebounce(async (q) => {
    if (q.trim().length < 2) {
      setResults({ users: [], rooms: [] });
      return;
    }
    setIsSearching(true);
    try {
      const typeParam = initialFilter !== 'all' ? `&type=${initialFilter}` : '';
      const res = await api.get(`/search?q=${encodeURIComponent(q)}${typeParam}`);
      setResults(res.results || { users: [], rooms: [] });
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, initialFilter]);

  // 4. Flat Results for Keyboard Navigation
  const allResults = [
    ...results.rooms.map(r => ({ ...r, type: 'room' })),
    ...results.users.map(u => ({ ...u, type: 'user' }))
  ];

  const handleSelect = async (item) => {
    onClose();
    if (item.type === 'room') {
      if (!item.isMember) {
        await api.post(`/rooms/${item.id}/join`);
        socket?.emit('join_room', { roomId: item.id });
        await fetchRooms();
      }
      navigate(`/dashboard/rooms/${item.id}`);
    } else {
      navigate(`/dashboard/dm/${item.id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected) handleSelect(selected);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search">
      <div className="search-input-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
        <span className="search-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search channels or people..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', height: '48px', paddingLeft: '44px', paddingRight: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#e2e8f0', fontSize: '16px' }}
        />
        {isSearching && <div className="search-spinner" style={{ position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)' }} />}
        <div className="search-kbd-hint" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>ESC</div>
      </div>

      <div className="search-results" style={{ minHeight: '200px' }}>
        {query.trim().length < 2 ? (
          <div className="search-hint" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>⌨️</span>
            <p>Type at least 2 characters to search</p>
          </div>
        ) : allResults.length === 0 && !isSearching ? (
          <div className="search-empty" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>💨</span>
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="search-scroll-area">
            {results.rooms.length > 0 && (
              <div className="search-section" style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', padding: '0 8px' }}>Rooms</h4>
                {results.rooms.map((room, i) => (
                  <div
                    key={room.id}
                    className={`search-item ${selectedIndex === i ? 'active' : ''}`}
                    onClick={() => handleSelect(room)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', background: selectedIndex === i ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                  >
                    <span style={{ color: '#64748b', marginRight: '12px', fontSize: '18px' }}>#</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{room.name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>{room.member_count} members {room.isMember && '• Joined'}</div>
                    </div>
                    {!room.isMember && <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>Join</span>}
                  </div>
                ))}
              </div>
            )}

            {results.users.length > 0 && (
              <div className="search-section">
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', padding: '0 8px' }}>People</h4>
                {results.users.map((u, i) => {
                  const absIdx = results.rooms.length + i;
                  return (
                    <div
                      key={u.id}
                      className={`search-item ${selectedIndex === absIdx ? 'active' : ''}`}
                      onClick={() => handleSelect(u)}
                      onMouseEnter={() => setSelectedIndex(absIdx)}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', background: selectedIndex === absIdx ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2d2d4a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', position: 'relative', overflow: 'hidden' }}>
                        {u.avatar ? (
                          <img src={u.avatar.startsWith('/uploads') ? `${FILE_URL}${u.avatar}` : u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{u.username?.charAt(0)?.toUpperCase() || '?'}</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', borderRadius: '50%', background: u.isOnline ? '#10b981' : '#64748b', border: '2px solid #1a1a2e' }}></span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{u.username}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>{u.isOnline ? 'Active now' : 'Offline'}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>DM</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: '#64748b', justifyContent: 'center' }} className="search-footer-hidden-mobile">
        <div><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>↑↓</kbd> Navigate</div>
        <div><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>↵</kbd> Select</div>
      </div>
    </Modal>
  );
};

export default SearchModal;
