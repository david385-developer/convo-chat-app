import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useChat, useSocket } from '../context';
import api from '../services/api';
import './RoomSettingsMenu.css';

/**
 * RoomSettingsMenu Component
 * 
 * A context-aware dropdown for room management actions.
 * Includes copy actions and room-exit logic.
 */
const RoomSettingsMenu = ({ isOpen, onClose, roomId, roomName, isCreator }) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  
  const { socket } = useSocket();
  const { fetchRooms } = useChat();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // 1. Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // 2. Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // 3. Reset internal state when closed
  useEffect(() => {
    if (!isOpen) {
      setShowLeaveConfirm(false);
      setCopiedItem(null);
    }
  }, [isOpen]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const confirmLeave = async () => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      socket.emit('leave_room', { roomId });
      await fetchRooms();
      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-menu-wrapper" ref={menuRef}>
      <div className="settings-menu glass">
        {/* Copy ID */}
        <button className="settings-menu-item" onClick={() => handleCopy(roomId, 'id')}>
          <span className="menu-icon">🆔</span>
          <span className="menu-label">Copy Room ID</span>
          {copiedItem === 'id' && <span className="menu-copied">Copied!</span>}
        </button>

        {/* Copy Invite Link */}
        <button className="settings-menu-item" onClick={() => handleCopy(`${window.location.origin}/dashboard/rooms/${roomId}`, 'link')}>
          <span className="menu-icon">🔗</span>
          <span className="menu-label">Invite Link</span>
          {copiedItem === 'link' && <span className="menu-copied">Copied!</span>}
        </button>

        {/* Room Info */}
        <button className="settings-menu-item" onClick={() => handleCopy(`Room: #${roomName}\nID: ${roomId}`, 'info')}>
          <span className="menu-icon">ℹ️</span>
          <span className="menu-label">Room Info</span>
          {copiedItem === 'info' && <span className="menu-copied">Copied!</span>}
        </button>

        <div className="settings-menu-divider"></div>

        {/* Leave Room with Inline Confirmation */}
        {!showLeaveConfirm ? (
          <button 
            className="settings-menu-item settings-menu-item--danger" 
            onClick={() => setShowLeaveConfirm(true)}
          >
            <span className="menu-icon">🚪</span>
            <span className="menu-label">Leave Room</span>
          </button>
        ) : (
          <div className="settings-leave-confirm">
            <span className="leave-confirm-text">Leave #{roomName}?</span>
            <div className="leave-confirm-actions">
              <button className="leave-cancel-btn" onClick={() => setShowLeaveConfirm(false)}>Cancel</button>
              <button className="leave-confirm-btn" onClick={confirmLeave}>Leave</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSettingsMenu;
