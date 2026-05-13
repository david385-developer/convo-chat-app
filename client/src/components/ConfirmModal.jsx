import React from 'react';
import Modal from './Modal';

/**
 * ConfirmModal Component
 * 
 * A reusable dialog for destructive actions (like deleting messages).
 */
const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  isDestructive = false 
}) => {
  if (!isOpen) return null;

  const actions = (
    <>
      <button 
        type="button" 
        className="modal-btn secondary" 
        onClick={onCancel} 
        style={{ order: window.innerWidth <= 768 ? 2 : 0 }}
      >
        {cancelText}
      </button>
      <button 
        type="button" 
        className={`modal-btn ${isDestructive ? 'danger' : 'primary'}`} 
        onClick={onConfirm} 
        style={{ order: window.innerWidth <= 768 ? 1 : 0 }}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} actions={actions}>
      <p style={{ color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmModal;
