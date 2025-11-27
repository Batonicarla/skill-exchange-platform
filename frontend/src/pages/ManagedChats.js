import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatManager from '../services/chatManager';
import api from '../services/api';

const ManagedChats = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load partner info
  const loadPartner = async () => {
    if (!partnerId) return;
    
    try {
      const response = await api.get(`/users/profile/${partnerId}`);
      if (response.data.success) {
        setPartner(response.data.data);
      }
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  // Load user chats
  const loadChats = async () => {
    try {
      const userChats = await chatManager.getUserChats();
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Initialize chat when partner is selected
  useEffect(() => {
    if (partnerId && userData?.uid) {
      setLoading(true);
      
      // Store user ID for chat manager
      localStorage.setItem('userId', userData.uid);
      
      // Start chat and subscribe to updates
      chatManager.startChat(partnerId).then(() => {
        const chatId = chatManager.generateChatId(partnerId);
        
        // Subscribe to message updates
        const unsubscribe = chatManager.subscribe(chatId, (newMessages) => {
          setMessages(newMessages);
        });
        
        // Load initial messages
        const initialMessages = chatManager.getMessages(partnerId);
        setMessages(initialMessages);
        
        // Load partner info
        loadPartner();
        setLoading(false);
        
        // Cleanup on unmount
        return () => {
          unsubscribe();
        };
      });
    } else {
      // Load chats list when no partner selected
      loadChats();
    }
  }, [partnerId, userData?.uid]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId) return;

    const messageText = newMessage;
    setNewMessage('');

    const success = await chatManager.sendMessage(partnerId, messageText);
    if (!success) {
      setNewMessage(messageText); // Restore message on failure
    }
  };

  // Format message time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chatManager.cleanup();
    };
  }, []);

  // Show chats list if no partner selected
  if (!partnerId) {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '20px' }}>Messages</h2>
        
        {chats.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)'
          }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              No conversations yet
            </p>
            <button 
              onClick={() => navigate('/matches')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Find Matches to Chat
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => navigate(`/chats/${chat.partner?.uid}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-alt)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '18px',
                  marginRight: '16px'
                }}>
                  {chat.partner?.displayName?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ 
                    margin: '0 0 4px 0', 
                    color: 'var(--color-text)', 
                    fontSize: '16px' 
                  }}>
                    {chat.partner?.displayName || 'Unknown User'}
                  </h4>
                  <p style={{
                    margin: 0,
                    color: 'var(--color-text-muted)',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {chat.lastMessage || 'Start a conversation'}
                  </p>
                </div>
                <div style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  marginLeft: '12px'
                }}>
                  {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show chat interface
  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--color-background)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => navigate('/chats')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            marginRight: '16px',
            fontSize: '16px'
          }}
        >
          ← Back
        </button>
        <h3 style={{ margin: 0, color: 'var(--color-text)' }}>
          {partner?.displayName || partner?.display_name || 'Chat'}
        </h3>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender_id === userData?.uid;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: '8px'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    backgroundColor: isOwn ? '#6b7280' : 'var(--color-surface-alt)',
                    color: isOwn ? 'white' : 'var(--color-text)',
                    wordWrap: 'break-word'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0' }}>{msg.message}</p>
                  <small style={{ opacity: 0.7, fontSize: '11px' }}>
                    {formatTime(msg.created_at)}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          padding: '16px 20px',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          gap: '12px'
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: '24px',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: 'pointer',
            opacity: newMessage.trim() ? 1 : 0.5
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ManagedChats;