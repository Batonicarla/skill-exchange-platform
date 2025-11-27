import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import RatingModal from '../components/RatingModal';
import './Sessions.css';

const Sessions = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
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
  }, [fetchSessions]);

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
      const response = await api.post('/sessions/propose', proposeData);
      if (response.data.success) {
        setMessage('Session proposed successfully!');
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
        setMessage(`Session ${action === 'confirm' ? 'confirmed' : 'rejected'}!`);
        fetchSessions();
        if (sessionDetails) {
          fetchSessionDetails();
        }
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

  if (sessionId && sessionDetails) {
    // Session details view
    return (
      <div className="container">
        <div className="session-details-page">
          <button onClick={() => navigate('/sessions')} className="btn btn-secondary">
            ← Back to Sessions
          </button>
          
          <div className="session-details-card">
            <h2>Session Details</h2>
            
            {message && (
              <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="session-info">
              <div className="info-row">
                <strong>Partner:</strong>
                <span>{sessionDetails.partner?.displayName || 'Unknown'}</span>
              </div>
              <div className="info-row">
                <strong>Skill:</strong>
                <span>{sessionDetails.skill}</span>
              </div>
              <div className="info-row">
                <strong>Date & Time:</strong>
                <span>{formatDateTime(sessionDetails.proposedDate, sessionDetails.proposedTime)}</span>
              </div>
              <div className="info-row">
                <strong>Status:</strong>
                <span style={{ color: getStatusColor(sessionDetails.status) }}>
                  {sessionDetails.status.toUpperCase()}
                </span>
              </div>
              {sessionDetails.notes && (
                <div className="info-row">
                  <strong>Notes:</strong>
                  <span>{sessionDetails.notes}</span>
                </div>
              )}
            </div>

            <div className="session-actions">
              {sessionDetails.status === 'pending' && sessionDetails.role === 'partner' && (
                <>
                  <button
                    onClick={() => handleRespondToSession(sessionId, 'confirm')}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleRespondToSession(sessionId, 'reject')}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Reject
                  </button>
                </>
              )}
              {['pending', 'confirmed'].includes(sessionDetails.status) && (
                <button
                  onClick={() => handleCancelSession(sessionId)}
                  className="btn btn-danger"
                  disabled={loading}
                >
                  Cancel Session
                </button>
              )}
              {sessionDetails.status === 'confirmed' && (
                <button
                  onClick={() => {
                    setSelectedSession({
                      sessionId: sessionDetails.sessionId || sessionId,
                      partnerId: sessionDetails.partner?.uid
                    });
                    setShowRatingModal(true);
                  }}
                  className="btn btn-accent"
                >
                  Rate Session
                </button>
              )}
            </div>
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
          <h1>My Sessions</h1>
          <button onClick={() => setShowProposeForm(!showProposeForm)} className="btn btn-primary">
            {showProposeForm ? 'Cancel' : 'Propose New Session'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {showProposeForm && (
          <div className="propose-session-form card">
            <h2>Propose a Session</h2>
            <form onSubmit={handleProposeSession}>
              <div className="form-group">
                <label>Partner Email</label>
                <input
                  type="email"
                  value={proposeData.partnerEmail}
                  onChange={(e) => setProposeData({ ...proposeData, partnerEmail: e.target.value })}
                  className="input"
                  required
                  placeholder="Enter partner's email address"
                />
              </div>
              <div className="form-group">
                <label>Skill</label>
                <input
                  type="text"
                  value={proposeData.skill}
                  onChange={(e) => setProposeData({ ...proposeData, skill: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., JavaScript, Guitar"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={proposeData.proposedDate}
                    onChange={(e) => setProposeData({ ...proposeData, proposedDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
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
                <label>Notes (Optional)</label>
                <textarea
                  value={proposeData.notes}
                  onChange={(e) => setProposeData({ ...proposeData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Additional details about the session"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Proposing...' : 'Propose Session'}
              </button>
            </form>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No sessions yet. Propose a session to start learning!</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.sessionId} className="session-card">
                <div className="session-card-header">
                  <h3>{session.skill}</h3>
                  <span
                    className="session-status"
                    style={{ backgroundColor: getStatusColor(session.status) }}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </div>
                <div className="session-card-info">
                  <p><strong>Role:</strong> {session.role}</p>
                  <p><strong>Date & Time:</strong> {formatDateTime(session.proposedDate, session.proposedTime)}</p>
                  {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                </div>
                <div className="session-card-actions">
                  <button
                    onClick={() => navigate(`/sessions/${session.sessionId}`)}
                    className="btn btn-primary"
                  >
                    View Details
                  </button>
                  {session.status === 'confirmed' && (
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
                      Rate
                    </button>
                  )}
                </div>
              </div>
            ))}
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

