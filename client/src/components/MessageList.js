import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, currentUserId }) => {
  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwnMessage={msg.sender._id === currentUserId}
        />
      ))}
    </div>
  );
};

export default MessageList;