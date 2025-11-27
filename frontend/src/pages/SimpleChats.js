import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatsList from '../components/ChatsList';
import './SimpleChats.css';

const SimpleChats = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
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

  const fetchMessages = async () => {
    if (!partnerId) return;
    
    try {
      const response = await api.get(`/chat/history/${partnerId}`);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const fetchPartnerInfo = async () => {
    if (!partnerId) return;
    
    try {
      const response = await api.get(`/users/profile/${partnerId}`);
      if (response.data.success) {
        setPartner(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching partner info:', error);
    }
  };

  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      Promise.all([fetchMessages(), fetchPartnerInfo()])
        .finally(() => setLoading(false));
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [partnerId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await api.post('/chat/send', {
        receiverId: partnerId,
        message: messageText
      });

      if (response.data.success) {
        // Add message immediately to UI
        const newMsg = {
          sender_id: userData?.uid,
          receiver_id: partnerId,
          message: messageText,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!partnerId) {
    return (
      <div className="container">
        <ChatsList />
      </div>
    );
  }

  return (
    <div className="simple-chat-container">
      <div className="chat-header">
        <button onClick={() => navigate('/chats')} className="back-btn">
          ← Back
        </button>
        <div className="partner-info">
          <h3>{partner?.displayName || partner?.display_name || 'Chat'}</h3>
        </div>
      </div>

      <div className="messages-area">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender_id === userData?.uid ? 'own' : 'other'}`}
            >
              <div className="message-content">
                <p>{msg.message}</p>
                <span className="message-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default SimpleChats;