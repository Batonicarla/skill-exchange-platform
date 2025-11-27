import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ImprovedSessions = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load sessions
  const loadSessions = async () => {
    try {
      const response = await api.get('/sessions');
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Load session details
  const loadSessionDetails = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      if (response.data.success) {
        setSessionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    } else {
      loadSessions();
    }
  }, [sessionId]);

  // Handle session response
  const handleSessionResponse = async (action) => {
    setLoading(true);
    try {
      const response = await api.put(`/sessions/${sessionId}/respond`, { action });
      if (response.data.success) {
        setMessage(`Session ${action === 'confirm' ? 'accepted' : 'declined'}!`);
        loadSessionDetails();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error responding to session');
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      rejected: '#ef4444',
      completed: '#6b7280',
      cancelled: '#9ca3af'
    };
    return colors[status] || '#6b7280';
  };

  // Show session details
  if (sessionId && sessionDetails) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px',
        backgroundColor: 'var(--color-background)',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <button 
          onClick={() => navigate('/sessions')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '16px'
          }}
        >
          ← Back to Sessions
        </button>

        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.includes('Error') ? '#fee2e2' : '#dcfce7',
            color: message.includes('Error') ? '#dc2626' : '#16a34a'
          }}>
            {message}
          </div>
        )}

        <div style={{
          backgroundColor: 'var(--color-surface)',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h1 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>
            Learning Session Details
          </h1>

          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Partner</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  {sessionDetails.partner?.displayName || 'Unknown'}
                </p>
              </div>
              
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Skill</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  {sessionDetails.skill}
                </p>
              </div>
              
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Status</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: getStatusColor(sessionDetails.status),
                  color: 'white'
                }}>
                  {sessionDetails.status.toUpperCase()}
                </span>
              </div>
              
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Date & Time</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  {formatDateTime(sessionDetails.proposed_date, sessionDetails.proposed_time)}
                </p>
              </div>
            </div>

            {sessionDetails.notes && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Notes</h3>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--color-text-muted)',
                  padding: '12px',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '8px'
                }}>
                  {sessionDetails.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {sessionDetails.status === 'pending' && sessionDetails.role === 'partner' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSessionResponse('confirm')}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Accept Session
              </button>
              <button
                onClick={() => handleSessionResponse('reject')}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Decline Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show sessions list
  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: 'var(--color-background)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>My Learning Sessions</h1>
        <button
          onClick={() => navigate('/matches')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Propose New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h3 style={{ color: 'var(--color-text)', marginBottom: '16px' }}>
            No sessions yet
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Start learning by proposing a session with your matches!
          </p>
          <button
            onClick={() => navigate('/matches')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Find Learning Partners
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {sessions.map((session) => (
            <div
              key={session.sessionId || session.id}
              style={{
                backgroundColor: 'var(--color-surface)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/sessions/${session.sessionId || session.id}`)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, color: 'var(--color-text)' }}>
                  {session.skill}
                </h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: getStatusColor(session.status),
                  color: 'white'
                }}>
                  {session.status.toUpperCase()}
                </span>
              </div>

              <p style={{ 
                margin: '0 0 12px 0', 
                color: 'var(--color-text-muted)',
                fontSize: '14px'
              }}>
                Role: {session.role === 'proposer' ? 'You proposed this session' : 'Proposed to you'}
              </p>

              <p style={{ 
                margin: '0 0 16px 0', 
                color: 'var(--color-text-muted)',
                fontSize: '14px'
              }}>
                {formatDateTime(session.proposed_date, session.proposed_time)}
              </p>

              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/sessions/${session.sessionId || session.id}`);
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImprovedSessions;