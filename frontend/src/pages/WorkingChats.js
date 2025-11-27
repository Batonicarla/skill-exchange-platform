import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WorkingChats = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch messages
  const loadMessages = async () => {
    if (!partnerId) return;
    
    try {
      const response = await api.get(`/chat/history/${partnerId}`);
      console.log('Messages response:', response.data);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Fetch partner info
  const loadPartner = async () => {
    if (!partnerId) return;
    
    try {
      const response = await api.get(`/users/profile/${partnerId}`);
      console.log('Partner response:', response.data);
      if (response.data.success) {
        setPartner(response.data.data);
      }
    } catch (error) {
      console.error('Error loading partner:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      console.log('Sending message:', { receiverId: partnerId, message: messageText });
      const response = await api.post('/chat/send', {
        receiverId: partnerId,
        message: messageText
      });
      
      console.log('Send response:', response.data);
      
      if (response.data.success) {
        // Add message to local state immediately
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
      setNewMessage(messageText); // Restore message
    }
  };

  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      Promise.all([loadMessages(), loadPartner()])
        .finally(() => setLoading(false));
      
      // Refresh messages every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [partnerId]);

  // If no partner selected, show simple message
  if (!partnerId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Select someone to chat with</h2>
        <button 
          onClick={() => navigate('/matches')} 
          style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Find Matches
        </button>
      </div>
    );
  }

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
                    backgroundColor: isOwn ? '#000' : 'var(--color-surface-alt)',
                    color: isOwn ? 'white' : 'var(--color-text)',
                    wordWrap: 'break-word'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0' }}>{msg.message}</p>
                  <small style={{ opacity: 0.7, fontSize: '11px' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </small>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={sendMessage}
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
            backgroundColor: '#000',
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

export default WorkingChats;