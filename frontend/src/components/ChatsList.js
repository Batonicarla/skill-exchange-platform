import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ChatsList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat/chats');
      if (response.data.success) {
        setChats(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return <div className="loading">Loading chats...</div>;
  }

  return (
    <div className="chats-list-container">
      <div className="chats-header">
        <h2>Messages</h2>
      </div>
      
      {chats.length === 0 ? (
        <div className="empty-chats">
          <p>No conversations yet</p>
          <button onClick={() => navigate('/matches')} className="btn btn-primary">
            Find Matches to Chat
          </button>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => navigate(`/chats/${chat.partner?.uid}`)}
              className="chat-item"
            >
              <div className="chat-avatar">
                {chat.partner?.displayName?.charAt(0) || '?'}
              </div>
              <div className="chat-info">
                <h4>{chat.partner?.displayName || 'Unknown User'}</h4>
                <p className="last-message">
                  {chat.lastMessage || 'Start a conversation'}
                </p>
              </div>
              <div className="chat-time">
                {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatsList;