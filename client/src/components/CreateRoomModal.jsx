import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Modal from './Modal';
import './CreateRoomModal.css';

/**
 * CreateRoomModal
 * A modal dialog for creating new public rooms.
 * Handles validation, submission, and immediate navigation.
 */
const CreateRoomModal = ({ isOpen, onClose }) => {
  const { fetchRooms } = useChat();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef(null);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      // Slight delay to ensure DOM is ready for focus
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Client-side validation logic
   */
  const validate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Room name is required');
      return false;
    }
    if (trimmedName.length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }
    if (trimmedName.length > 50) {
      setError('Name must be 50 characters or less');
      return false;
    }
    // Only letters, numbers, spaces, hyphens, and underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      setError('Only letters, numbers, spaces, hyphens, and underscores allowed');
      return false;
    }
    // No leading or trailing spaces
    if (trimmedName !== trimmedName.replace(/^\s+|\s+$/g, '')) {
      setError('No leading or trailing spaces');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * Submit Handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/rooms', {
        name: name.trim(),
        description: description.trim()
      });

      // 1. Refresh global rooms list for sidebar
      await fetchRooms();

      // 2. Join the socket room channel immediately
      if (socket) {
        socket.emit('join_room', { roomId: res.room.id });
      }

      // 3. Cleanup and Navigate
      onClose();
      navigate(`/dashboard/rooms/${res.room.id}`);

    } catch (err) {
      // Handle server-side errors (e.g. 409 Conflict)
      if (err.message?.includes('already taken') || err.message?.includes('409')) {
        setError('This room name is already taken');
      } else {
        setError(err.message || 'Failed to create room');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = (
    <>
      <button type="button" className="modal-btn secondary" onClick={onClose} style={{ order: window.innerWidth <= 768 ? 2 : 0 }}>
        Cancel
      </button>
      <button type="button" className="modal-btn primary" onClick={handleSubmit} disabled={isSubmitting || !name.trim()} style={{ order: window.innerWidth <= 768 ? 1 : 0 }}>
        {isSubmitting ? 'Creating...' : 'Create Room'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a new room" actions={actions}>
      <form id="createRoomForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="room-name">Room Name <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '12px', color: '#64748b' }}>#</span>
            <input
              ref={nameInputRef}
              id="room-name"
              type="text"
              placeholder="e.g. project-alpha"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              maxLength={50}
              disabled={isSubmitting}
              autoComplete="off"
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
            {error ? <span style={{ color: '#ef4444' }}>{error}</span> : <span></span>}
            <span style={{ color: '#64748b' }}>{name.length}/50</span>
          </div>
        </div>

        <div>
          <label htmlFor="room-desc">Description <span style={{ color: '#64748b', fontWeight: 'normal', textTransform: 'none' }}>(optional)</span></label>
          <textarea
            id="room-desc"
            placeholder="What's this room about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={200}
            disabled={isSubmitting}
          />
          <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
            {description.length}/200
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoomModal;
