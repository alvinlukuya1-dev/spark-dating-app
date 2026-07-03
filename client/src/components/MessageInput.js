import React, { useState } from 'react';

const MessageInput = ({ onSend, receiverId }) => {
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('text');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !mediaUrl) return;
    onSend(message, mediaUrl, mediaType);
    setMessage('');
    setMediaUrl('');
    setMediaType('text');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      setMediaUrl(URL.createObjectURL(file));
      setMediaType('image');
    } else {
      setMediaUrl(URL.createObjectURL(file));
      setMediaType('file');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <div className="input-wrapper">
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          hidden
          id="fileInput"
        />
        <label htmlFor="fileInput" className="plus-btn">+</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          rows={1}
        />
        {mediaUrl && (
          <div className="attach-indicator">
            {mediaType === 'image' ? '📷' : '📎'}
            <button type="button" onClick={() => { setMediaUrl(''); setMediaType('text'); }} className="remove-attach">×</button>
          </div>
        )}
      </div>
      <button type="submit" disabled={!message.trim() && !mediaUrl} className="send-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
