import React, { useState } from 'react';

const MessageInput = ({ onSend, receiverId }) => {
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('text'); // text, image, file
  const [loading, setLoading] = useState(false);

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
    // For simplicity, we'll just set the URL to a blob URL
    // In a real app, you'd upload to a server first
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
      <div className="message-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          rows={2}
        />
        <div className="attachment-controls">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <label htmlFor="fileInput" className="attach-btn">📎</label>
          {mediaUrl && (
            <div className="attachment-preview">
              {mediaType === 'image' && <img src={mediaUrl} alt="Preview" />}
              {mediaType === 'file' && <span>📎 Attachment</span>}
              <button onClick={() => { setMediaUrl(''); setMediaType('text'); }} className="remove-attachment">×</button>
            </div>
          )}
        </div>
      </div>
      <button type="submit" disabled={loading || (!message.trim() && !mediaUrl)} className="send-btn">
        {loading ? '...' : 'Send'}
      </button>
    </form>
  );
};

export default MessageInput;