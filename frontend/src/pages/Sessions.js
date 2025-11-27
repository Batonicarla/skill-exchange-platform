import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import RatingModal from '../components/RatingModal';
import './Sessions.css';

const Sessions = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposeData, setProposeData] = useState({
    partnerEmail: '',
    proposedDate: '',
    proposedTime: '',
    skill: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, []);

  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      if (response.data.success) {
        setSessionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessions();
    
    // Check URL parameters for auto-opening propose form
    const urlParams = new URLSearchParams(location.search);
    const shouldPropose = urlParams.get('propose');
    const email = urlParams.get('email');
    const name = urlParams.get('name');
    
    if (shouldPropose === 'true') {
      setShowProposeForm(true);
      if (email) {
        setProposeData(prev => ({
          ...prev,
          partnerEmail: decodeURIComponent(email)
        }));
      }
    }
  }, [fetchSessions, location.search]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, fetchSessionDetails]);

  const handleProposeSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/sessions/propose', {
        partnerEmail: proposeData.partnerEmail,
        proposedDate: proposeData.proposedDate,
        proposedTime: proposeData.proposedTime,
        skill: proposeData.skill,
        notes: proposeData.notes
      });
      if (response.data.success) {
        setMessage('🎉 Session proposed successfully!');
        setShowProposeForm(false);
        setProposeData({
          partnerEmail: '',
          proposedDate: '',
          proposedTime: '',
          skill: '',
          notes: ''
        });
        fetchSessions();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error proposing session');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToSession = async (sessionId, action) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put(`/sessions/${sessionId}/respond`, { action });
      if (response.data.success) {
        const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
        
        // Immediately update local state for instant UI feedback
        setSessionDetails(prev => ({
          ...prev,
          status: newStatus,
          respondedAt: new Date().toISOString()
        }));
        
        if (action === 'confirm') {
          setMessage('🎉 Session confirmed! You can now chat to coordinate the session details.');
        } else {
          setMessage('Session declined.');
        }
        
        // Refresh data in background
        fetchSessionDetails();
        fetchSessions();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error responding to session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await api.put(`/sessions/${sessionId}/cancel`);
      if (response.data.success) {
        setMessage('Session cancelled successfully!');
        fetchSessions();
        if (sessionDetails) {
          fetchSessionDetails();
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error cancelling session');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f97316',
      confirmed: '#22c55e',
      rejected: '#ef4444',
      completed: '#475569',
      cancelled: '#94a3b8'
    };
    return colors[status] || '#475569';
  };

  const formatDateTime = (date, time) => {
    if (!date) return '';
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString();
  };

  if (sessionId && loading) {
    return (
      <div className="container">
        <div className="session-details-page">
          <p>Loading session details...</p>
        </div>
      </div>
    );
  }

  if (sessionId && sessionDetails) {
    // Session details view
    return (
      <div className="container">
        <div className="session-details-page">
          <button onClick={() => navigate('/sessions')} className="btn btn-secondary">
            ← Back to Sessions
          </button>
          
          <div className="session-details-card">
            <div className="session-header">
              <h2>Session Details</h2>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(sessionDetails.status) }}
              >
                {sessionDetails.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            
            {message && (
              <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="session-info">
              <div className="info-section">
                <h3>🎯 Session Details</h3>
                <div className="info-row">
                  <strong>Skill to Learn:</strong>
                  <span>{sessionDetails.skill}</span>
                </div>
                <div className="info-row">
                  <strong>Proposed Date:</strong>
                  <span>{new Date(sessionDetails.proposedDate).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <strong>Proposed Time:</strong>
                  <span>{sessionDetails.proposedTime}</span>
                </div>
                <div className="info-row">
                  <strong>Session Created:</strong>
                  <span>{new Date(sessionDetails.createdAt).toLocaleString()}</span>
                </div>
                {sessionDetails.notes && (
                  <div className="info-row">
                    <strong>Your Notes:</strong>
                    <span>{sessionDetails.notes}</span>
                  </div>
                )}
                {!sessionDetails.notes && (
                  <div className="info-row">
                    <strong>Notes:</strong>
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No additional notes provided</span>
                  </div>
                )}
              </div>

              <div className="info-section">
                <h3>👤 Partner Information</h3>
                <div className="info-row">
                  <strong>Partner Name:</strong>
                  <span>{sessionDetails.partner?.displayName || 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <strong>Partner Email:</strong>
                  <span>{sessionDetails.partner?.email || 'Not available'}</span>
                </div>
                <div className="info-row">
                  <strong>Your Role:</strong>
                  <span>{sessionDetails.role === 'proposer' ? '👨🎓 You are learning from them' : '👨🏫 You are teaching them'}</span>
                </div>
                {sessionDetails.partner?.bio && (
                  <div className="info-row">
                    <strong>Partner Bio:</strong>
                    <span>{sessionDetails.partner.bio}</span>
                  </div>
                )}
              </div>

              <div className="info-section">
                <h3>📅 Session Status</h3>
                <div className="info-row">
                  <strong>Current Status:</strong>
                  <span style={{ 
                    color: getStatusColor(sessionDetails.status),
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {sessionDetails.status}
                  </span>
                </div>
                {sessionDetails.status === 'pending' && sessionDetails.role === 'proposer' && (
                  <div className="info-row">
                    <strong>Waiting for:</strong>
                    <span>{sessionDetails.partner?.displayName || 'Partner'} to respond to your request</span>
                  </div>
                )}
                {sessionDetails.status === 'confirmed' && (
                  <div className="info-row">
                    <strong>Status:</strong>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Session Confirmed! Ready to start learning.</span>
                  </div>
                )}
                {sessionDetails.respondedAt && (
                  <div className="info-row">
                    <strong>Response Date:</strong>
                    <span>{new Date(sessionDetails.respondedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="session-actions">
              {sessionDetails.status === 'pending' && sessionDetails.role === 'partner' && (
                <div className="action-group">
                  <h4>Respond to Session Request</h4>
                  <p>Someone wants to learn {sessionDetails.skill} from you!</p>
                  <button
                    onClick={() => handleRespondToSession(sessionId, 'confirm')}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    ✓ Accept Session
                  </button>
                  <button
                    onClick={() => handleRespondToSession(sessionId, 'reject')}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    ✗ Decline Session
                  </button>
                </div>
              )}
              
              {sessionDetails.status === 'pending' && sessionDetails.role === 'proposer' && (
                <div className="action-group">
                  <h4>⏳ Waiting for Response</h4>
                  <p className="waiting-message">Your session request has been sent to {sessionDetails.partner?.displayName || 'your partner'}. They will receive a notification and can accept or decline from their sessions page.</p>
                </div>
              )}
              
              {sessionDetails.status === 'rejected' && (
                <div className="action-group" style={{ borderColor: '#fee2e2', background: '#fef2f2' }}>
                  <h4>❌ Session Declined</h4>
                  <p>Unfortunately, this session request was declined. You can try proposing a different time or skill.</p>
                </div>
              )}

              {sessionDetails.status === 'confirmed' && (
                <div className="action-group">
                  <h4>🎉 Session Confirmed!</h4>
                  <p>Great! You can now chat with your learning partner to coordinate the session details.</p>
                  <Link 
                    to={`/chats/${sessionDetails.role === 'proposer' ? sessionDetails.partnerId : sessionDetails.proposerId}`}
                    className="btn btn-primary"
                  >
                    💬 Start Chatting
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedSession({
                        sessionId: sessionDetails.sessionId || sessionId,
                        partnerId: sessionDetails.role === 'proposer' ? sessionDetails.partnerId : sessionDetails.proposerId
                      });
                      setShowRatingModal(true);
                    }}
                    className="btn btn-accent"
                  >
                    ⭐ Rate Session
                  </button>
                </div>
              )}

              {['pending', 'confirmed'].includes(sessionDetails.status) && (
                <div className="action-group danger-zone">
                  <button
                    onClick={() => handleCancelSession(sessionId)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    🗑️ Cancel Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionId && !sessionDetails && !loading) {
    return (
      <div className="container">
        <div className="session-details-page">
          <button onClick={() => navigate('/sessions')} className="btn btn-secondary">
            ← Back to Sessions
          </button>
          <div className="error-state">
            <h2>Session Not Found</h2>
            <p>The session you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  // Sessions list view
  return (
    <div className="container">
      <div className="sessions-page">
        <div className="sessions-header">
          <h1>My Learning Sessions</h1>
          <div className="header-actions">
            <Link to="/matches" className="btn btn-secondary">
              Find Learning Partners
            </Link>
            <button onClick={() => setShowProposeForm(!showProposeForm)} className="btn btn-primary">
              {showProposeForm ? 'Cancel' : '+ Propose Session'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {showProposeForm && (
          <div className="propose-session-form card">
            <div className="form-header">
              <h2>📚 Propose a Learning Session</h2>
              <p>Reach out to someone directly to start learning together!</p>
            </div>
            
            <form onSubmit={handleProposeSession}>
              <div className="form-group">
                <label>👤 Partner's Email Address</label>
                <input
                  type="email"
                  value={proposeData.partnerEmail}
                  onChange={(e) => setProposeData({ ...proposeData, partnerEmail: e.target.value })}
                  className="input"
                  required
                  placeholder="Enter their email address"
                />
                <small className="form-hint">We'll send them a notification about your session request</small>
              </div>
              
              <div className="form-group">
                <label>🎯 What do you want to learn?</label>
                <input
                  type="text"
                  value={proposeData.skill}
                  onChange={(e) => setProposeData({ ...proposeData, skill: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., JavaScript, Guitar, Spanish, Cooking"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>📅 Preferred Date</label>
                  <input
                    type="date"
                    value={proposeData.proposedDate}
                    onChange={(e) => setProposeData({ ...proposeData, proposedDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>🕐 Preferred Time</label>
                  <input
                    type="time"
                    value={proposeData.proposedTime}
                    onChange={(e) => setProposeData({ ...proposeData, proposedTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>📝 Additional Notes (Optional)</label>
                <textarea
                  value={proposeData.notes}
                  onChange={(e) => setProposeData({ ...proposeData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Any specific topics, meeting preferences, or other details..."
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowProposeForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending Request...' : '📤 Send Session Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Learning Sessions Yet</h3>
            <p>Start your learning journey by proposing a session or finding matches!</p>
            <div className="empty-actions">
              <Link to="/matches" className="btn btn-primary">
                Find Learning Partners
              </Link>
              <button onClick={() => setShowProposeForm(true)} className="btn btn-secondary">
                Propose Session
              </button>
            </div>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => {
              const isTeaching = session.role === 'partner';
              const isLearning = session.role === 'proposer';
              
              return (
                <div key={session.sessionId} className="session-card">
                  <div className="session-card-header">
                    <div className="session-title">
                      <h3>{session.skill}</h3>
                      <span className="role-indicator">
                        {isTeaching ? '👨‍🏫 Teaching' : '👨‍🎓 Learning'}
                      </span>
                    </div>
                    <span
                      className="session-status"
                      style={{ backgroundColor: getStatusColor(session.status) }}
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="session-card-info">
                    <div className="info-item">
                      <span className="info-label">📅 Date & Time:</span>
                      <span>{formatDateTime(session.proposedDate, session.proposedTime)}</span>
                    </div>
                    
                    {session.partnerName && (
                      <div className="info-item">
                        <span className="info-label">👤 Partner:</span>
                        <span>{session.partnerName}</span>
                      </div>
                    )}
                    
                    {session.notes && (
                      <div className="info-item">
                        <span className="info-label">📝 Notes:</span>
                        <span>{session.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="session-card-actions">
                    <button
                      onClick={() => navigate(`/sessions/${session.sessionId}`)}
                      className="btn btn-primary"
                    >
                      View Details
                    </button>
                    
                    {session.status === 'confirmed' && (
                      <>
                        <Link
                          to={`/chats/${session.role === 'proposer' ? session.partnerId : session.proposerId}`}
                          className="btn btn-primary"
                        >
                          💬 Chat
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedSession({
                              sessionId: session.sessionId,
                              partnerId: session.role === 'proposer' ? session.partnerId : session.proposerId
                            });
                            setShowRatingModal(true);
                          }}
                          className="btn btn-accent"
                        >
                          ⭐ Rate
                        </button>
                      </>
                    )}
                    
                    {session.status === 'pending' && session.role === 'partner' && (
                      <button
                        onClick={() => navigate(`/sessions/${session.sessionId}`)}
                        className="btn btn-accent"
                      >
                        ⏳ Respond
                      </button>
                    )}
                    
                    {session.status === 'pending' && session.role === 'proposer' && (
                      <span className="waiting-indicator" style={{ 
                        color: 'var(--color-text-muted)', 
                        fontSize: '12px',
                        fontStyle: 'italic'
                      }}>
                        Waiting for response...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {showRatingModal && selectedSession && (
          <RatingModal
            session={selectedSession}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedSession(null);
            }}
            onSubmit={() => {
              setMessage('Rating submitted successfully!');
              fetchSessions();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Sessions;

