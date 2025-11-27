import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ModernChats.css';

const ModernChats = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat/chats');
      if (response.data.success) {
        setChats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchChatHistory = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/chat/history/${partnerId}`);
      if (response.data.success) {
        setMessages(response.data.data);
        
        // Get partner info
        const partnerResponse = await api.get(`/users/profile/${partnerId}`);
        if (partnerResponse.data.success) {
          setPartner(partnerResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (partnerId) {
      fetchChatHistory();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchChatHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [partnerId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId) return;

    const messageText = newMessage;
    setNewMessage('');

    // Optimistically add message
    const tempMessage = {
      sender_id: userData?.uid,
      receiver_id: partnerId,
      message: messageText,
      created_at: new Date().toISOString(),
      temp: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await api.post('/chat/send', {
        receiverId: partnerId,
        message: messageText
      });

      if (response.data.success) {
        // Remove temp message and add real one
        setMessages(prev => prev.filter(msg => !msg.temp));
        fetchChatHistory();
        fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      setMessages(prev => prev.filter(msg => !msg.temp));
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

  if (partnerId) {
    return (
      <div className="modern-chat-container">
        <div className="chat-header">
          <button onClick={() => navigate('/chats')} className="back-btn">
            ←
          </button>
          <div className="partner-info">
            <div className="partner-avatar">
              {partner?.display_name?.charAt(0) || '?'}
            </div>
            <div className="partner-details">
              <h3>{partner?.display_name || 'Chat'}</h3>
              <span className="online-status">Online</span>
            </div>
          </div>
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <p>No messages yet</p>
              <span>Start the conversation!</span>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender_id === userData?.uid;
              const showAvatar = idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id;
              
              return (
                <div key={idx} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
                  {!isOwn && showAvatar && (
                    <div className="message-avatar">
                      {partner?.display_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${msg.temp ? 'sending' : ''}`}>
                    <p>{msg.message}</p>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="message-input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="message-input"
            />
            <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="modern-chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
        </div>
        
        <div className="chats-list">
          {chats.length === 0 ? (
            <div className="empty-chats">
              <p>No conversations yet</p>
              <button onClick={() => navigate('/matches')} className="btn-primary">
                Find Matches
              </button>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => navigate(`/chats/${chat.partner.uid}`)}
                className="chat-item"
              >
                <div className="chat-avatar">
                  {chat.partner.displayName?.charAt(0) || '?'}
                </div>
                <div className="chat-info">
                  <h4>{chat.partner.displayName}</h4>
                  <p className="last-message">
                    {chat.lastMessage || 'Start a conversation'}
                  </p>
                </div>
                <div className="chat-time">
                  {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="chat-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    </div>
  );
};

export default ModernChats;