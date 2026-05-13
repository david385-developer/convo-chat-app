import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import './MessageInput.css';

const MessageInput = ({ isRoom, roomId, conversationId, placeholder }) => {
  const { socket } = useSocket();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [content]);

  const handleTyping = useCallback(() => {
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', {
        roomId: isRoom ? roomId : null,
        conversationId: !isRoom ? conversationId : null
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_stop', {
        roomId: isRoom ? roomId : null,
        conversationId: !isRoom ? conversationId : null
      });
    }, 2000);
  }, [socket, isRoom, roomId, conversationId]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !file) return;
    
    if (!socket) {
      console.error('[MessageInput] Socket not connected!');
      return;
    }

    try {
      let finalMediaUrl = null;
      let type = 'TEXT';

      // 1. If there's a file, upload it first to get a persistent URL
      if (file) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await api.upload('/upload/image', formData, (progress) => {
          setUploadProgress(progress);
        });
        finalMediaUrl = res.url;
        type = 'IMAGE';
      } else if (/[*_`#\[]/.test(trimmed)) {
        type = 'MARKDOWN';
      }

      // 2. EMIT SOCKET MESSAGE
      const payload = {
        content: trimmed || file?.name,
        type,
        roomId: isRoom ? roomId : null,
        conversationId: !isRoom ? conversationId : null,
        mediaUrl: finalMediaUrl
      };

      console.log('[MessageInput] Emitting send_message:', payload);
      socket.emit('send_message', payload);

      // 3. CLEANUP
      setContent('');
      setFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      setIsUploading(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      clearTimeout(typingTimeoutRef.current);
      isTypingRef.current = false;
      socket.emit('typing_stop', {
        roomId: isRoom ? roomId : null,
        conversationId: !isRoom ? conversationId : null
      });

      textareaRef.current?.focus();
    } catch (err) {
      console.error('[MessageInput] Failed to send message:', err);
      setIsUploading(false);
      setUploadProgress(0);
      alert(err.message || 'Failed to send message');
    }
  }, [content, file, socket, isRoom, roomId, conversationId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(selected.type)) {
      alert('Only images (JPEG, PNG, WEBP, GIF) are allowed');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    setFile(selected);
    setFilePreview(URL.createObjectURL(selected));
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  return (
    <div className="message-input-wrapper">
      {filePreview && (
        <div className="file-preview">
          <img src={filePreview} alt="Preview" />
          <div className="file-preview-info">
            <span className="file-preview-name">{file?.name}</span>
            <span className="file-preview-size">
              {(file?.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <button 
            className="file-preview-remove" 
            onClick={() => { setFile(null); setFilePreview(null); setUploadProgress(0); }}
            disabled={isUploading}
          >
            ✕
          </button>
          {isUploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      <div className="message-input-container">
        <button 
          className="attach-btn" 
          onClick={() => fileInputRef.current?.click()}
          title="Attach an image"
        >
          📎
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,image/gif" 
          hidden 
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="message-textarea"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={(!content.trim() && !file) || isUploading}
          title="Send message (Enter)"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
