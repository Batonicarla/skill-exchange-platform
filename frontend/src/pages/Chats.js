import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Chats.css';

const Chats = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const response = await api.get('/chat/chats');
      if (response.data.success) {
        setChats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, []);

  const fetchChatHistory = useCallback(async () => {
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
  }, [partnerId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (partnerId) {
      fetchChatHistory();
    }
  }, [partnerId, fetchChatHistory]);

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
        setMessages([...messages, {
          ...response.data.data,
          created_at: new Date().toISOString()
        }]);
        fetchChats(); // Refresh chat list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (partnerId) {
    // Chat view
    return (
      <div className="container">
        <div className="chat-page">
          <div className="chat-header">
            <button onClick={() => navigate('/chats')} className="btn btn-secondary">
              ← Back to Chats
            </button>
            <h2>{partner?.displayName || 'Chat'}</h2>
          </div>

          <div className="chat-messages">
            {loading ? (
              <p>Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${msg.sender_id === userData?.uid ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input"
            />
            <button type="submit" className="btn btn-primary">
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chats list view
  return (
    <div className="container">
      <div className="chats-list-page">
        <h1>My Chats</h1>

        {chats.length === 0 ? (
          <div className="empty-state">
            <p>No chats yet. Start a conversation with a match!</p>
            <Link to="/matches" className="btn btn-primary">View Matches</Link>
          </div>
        ) : (
          <div className="chats-list">
            {chats.map((chat) => (
              <Link
                key={chat.chatId}
                to={`/chats/${chat.partner.uid}`}
                className="chat-item"
              >
                <div className="chat-item-info">
                  <h3>{chat.partner.displayName}</h3>
                  <p className="last-message">{chat.lastMessage}</p>
                </div>
                <div className="chat-item-time">
                  {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;

