import React, { useState } from 'react';
import api from '../services/api';
import { useChat } from '../context';
import Modal from './Modal';

const RoomSettingsModal = ({ room, onClose }) => {
  const { fetchRooms, selectRoom } = useChat();
  const [name, setName] = useState(room?.name || '');
  const [description, setDescription] = useState(room?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    setError(null);
    try {
      await api.put(`/rooms/${room.id}`, { name, description });
      await fetchRooms();
      await selectRoom(room.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update room');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) return;
    
    setIsSaving(true);
    try {
      await api.del(`/rooms/${room.id}`);
      await fetchRooms();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Failed to delete room');
      setIsSaving(false);
    }
  };

  const actions = (
    <>
      <button type="button" className="modal-btn danger" onClick={handleDelete} disabled={isSaving} style={{ order: window.innerWidth <= 768 ? 3 : 0, marginRight: window.innerWidth <= 768 ? 0 : 'auto' }}>
        Delete Room
      </button>
      <button type="button" className="modal-btn secondary" onClick={onClose} style={{ order: window.innerWidth <= 768 ? 2 : 0 }}>
        Cancel
      </button>
      <button type="button" className="modal-btn primary" onClick={handleSave} disabled={isSaving} style={{ order: window.innerWidth <= 768 ? 1 : 0 }}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Room Settings" actions={actions}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label>Room Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. general"
            required
          />
        </div>
        
        <div>
          <label>Description (Optional)</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="What's this room about?"
            rows={3}
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
      </div>
    </Modal>
  );
};

export default RoomSettingsModal;
