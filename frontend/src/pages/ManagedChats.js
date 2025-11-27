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
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionRequest, setSessionRequest] = useState({
    skill: '',
    date: '',
    time: '',
    duration: '60',
    location: '',
    notes: ''
  });
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

  // Send session request
  const handleSendSessionRequest = async (e) => {
    e.preventDefault();
    if (!partnerId) return;

    try {
      const response = await api.post('/sessions/propose', {
        partnerEmail: partner?.email,
        proposedDate: sessionRequest.date,
        proposedTime: sessionRequest.time,
        skill: sessionRequest.skill,
        duration: sessionRequest.duration,
        location: sessionRequest.location,
        notes: sessionRequest.notes
      });

      if (response.data.success) {
        // Send a special message in chat about the session request
        const sessionMessage = `📅 Session Request Sent\n\n🎯 Skill: ${sessionRequest.skill}\n📅 Date: ${new Date(sessionRequest.date).toLocaleDateString()}\n🕐 Time: ${sessionRequest.time}\n⏱️ Duration: ${sessionRequest.duration} minutes\n📍 Location: ${sessionRequest.location || 'To be decided'}\n\n${sessionRequest.notes ? '📝 Notes: ' + sessionRequest.notes : ''}`;
        
        await chatManager.sendMessage(partnerId, sessionMessage);
        
        setShowSessionForm(false);
        setSessionRequest({
          skill: '',
          date: '',
          time: '',
          duration: '60',
          location: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error sending session request:', error);
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

  // Show chats with sidebar layout
  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      display: 'flex',
      backgroundColor: 'var(--color-background)'
    }}>
      {/* Sidebar - Conversations List */}
      <div style={{
        width: '320px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: 'var(--color-text)' }}>💬 Messages</h2>
          <button 
            onClick={() => navigate('/matches')}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + New Chat
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'var(--color-text-muted)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p>No conversations yet</p>
              <p style={{ fontSize: '14px' }}>Find matches to start chatting!</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => navigate(`/chats/${chat.partner?.uid}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: partnerId === chat.partner?.uid ? 'var(--color-primary-light)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (partnerId !== chat.partner?.uid) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (partnerId !== chat.partner?.uid) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
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
            ))
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!partnerId ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
              <h3 style={{ margin: '0 0 8px 0' }}>Select a conversation</h3>
              <p>Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        ) : (
          <ChatInterface 
            partnerId={partnerId}
            partner={partner}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            loading={loading}
            userData={userData}
            formatTime={formatTime}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );

// Chat Interface Component
const ChatInterface = ({ partnerId, partner, messages, newMessage, setNewMessage, handleSendMessage, loading, userData, formatTime, navigate }) => {
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          marginRight: '12px'
        }}>
          {partner?.displayName?.charAt(0) || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)' }}>
            {partner?.displayName || partner?.display_name || 'Chat'}
          </h3>
        </div>
        <button
          onClick={() => setShowSessionForm(!showSessionForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Request Session
        </button>
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <p>No messages yet. Start the conversation!</p>
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
                    backgroundColor: isOwn ? '#6b7280' : 'var(--color-surface)',
                    color: isOwn ? 'white' : 'var(--color-text)',
                    wordWrap: 'break-word',
                    border: isOwn ? 'none' : '1px solid var(--color-border)'
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

      {/* Session Request Form */}
      {showSessionForm && (
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-text)' }}>📅 Request Learning Session</h4>
          <form onSubmit={handleSendSessionRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                placeholder="Skill to learn"
                value={sessionRequest.skill}
                onChange={(e) => setSessionRequest({...sessionRequest, skill: e.target.value})}
                required
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
              />
              <select
                value={sessionRequest.duration}
                onChange={(e) => setSessionRequest({...sessionRequest, duration: e.target.value})}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="date"
                value={sessionRequest.date}
                onChange={(e) => setSessionRequest({...sessionRequest, date: e.target.value})}
                required
                min={new Date().toISOString().split('T')[0]}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
              />
              <input
                type="time"
                value={sessionRequest.time}
                onChange={(e) => setSessionRequest({...sessionRequest, time: e.target.value})}
                required
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
              />
            </div>
            <input
              type="text"
              placeholder="Location or meeting link"
              value={sessionRequest.location}
              onChange={(e) => setSessionRequest({...sessionRequest, location: e.target.value})}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)'
              }}
            />
            <textarea
              placeholder="Additional notes (optional)"
              value={sessionRequest.notes}
              onChange={(e) => setSessionRequest({...sessionRequest, notes: e.target.value})}
              rows="2"
              style={{
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowSessionForm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                📤 Send Request
              </button>
            </div>
          </form>
        </div>
      )}

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
          📤 Send
        </button>
      </form>
    </>
  );
};
};

export default ManagedChats;