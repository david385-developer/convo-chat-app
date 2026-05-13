import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context';
import { api } from '../services/api';
import './StartDMButton.css';

const StartDMButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { onlineUsers } = useChat();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch users when opening
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const res = await api.get('/users');
          setUsers(res.users);
        } catch (err) {
          console.error('Failed to fetch users:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartDM = (userId) => {
    setIsOpen(false);
    navigate(`/dashboard/dm/${userId}`);
  };

  return (
    <div className="start-dm-wrapper" ref={dropdownRef}>
      <button 
        className="add-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="New Message"
      >
        +
      </button>

      {isOpen && (
        <div className="dm-dropdown">
          <div className="dm-dropdown-search">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="dm-dropdown-list">
            {isLoading ? (
              <div className="dm-loading">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="dm-user-item"
                  onClick={() => handleStartDM(user.id)}
                >
                  <div className="user-avatar-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="dm-user-info">
                    <span className="dm-username">{user.username}</span>
                    <span className={`dm-status ${onlineUsers[user.id] ? 'online' : ''}`}>
                      {onlineUsers[user.id] ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="dm-empty">No users found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StartDMButton;
