import React from 'react';

const MessageBubble = ({ message, isOwnMessage }) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
      <div className="message-content">
        {message.mediaUrl && message.type === 'image' ? (
          <img src={message.mediaUrl} alt="" className="message-image" />
        ) : (
          <p>{message.content}</p>
        )}
      </div>
      <div className="message-time">{time}</div>
    </div>
  );
};

export default MessageBubble;