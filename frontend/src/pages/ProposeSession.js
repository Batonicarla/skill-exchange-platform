import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProposeSession = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    skill: '',
    date: '',
    time: '',
    notes: ''
  });

  // Load partner info
  useEffect(() => {
    const loadPartner = async () => {
      try {
        const response = await api.get(`/users/profile/${partnerId}`);
        if (response.data.success) {
          setPartner(response.data.data);
        }
      } catch (error) {
        console.error('Error loading partner:', error);
      }
    };

    if (partnerId) {
      loadPartner();
    }
  }, [partnerId]);

  // Get today's date as minimum
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/sessions/propose', {
        partnerEmail: partner?.email || partner?.user_email,
        proposedDate: formData.date,
        proposedTime: formData.time,
        skill: formData.skill,
        notes: formData.notes
      });

      if (response.data.success) {
        setMessage('🎉 Session request sent successfully! They will be notified and can respond from their sessions page.');
        setTimeout(() => {
          navigate('/sessions');
        }, 3000);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error proposing session');
    } finally {
      setLoading(false);
    }
  };

  if (!partner) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading partner information...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: 'var(--color-background)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <button 
          onClick={() => navigate('/matches')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            marginRight: '16px',
            fontSize: '16px'
          }}
        >
          ← Back to Matches
        </button>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>
          Propose Learning Session
        </h1>
      </div>

      {/* Partner Info */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)' }}>
            🤝 Learning Partner: {partner.displayName || partner.display_name || partner.name}
          </h3>
        </div>
        <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-muted)' }}>
          {partner.bio || 'No bio available'}
        </p>
        {partner.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>⭐ {partner.rating}/5</span>
            <span style={{ color: 'var(--color-text-muted)' }}>({partner.totalRatings || 0} reviews)</span>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#fee2e2' : '#dcfce7',
          color: message.includes('Error') ? '#dc2626' : '#16a34a',
          border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`
        }}>
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'var(--color-surface)',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>
          📅 Session Details
        </h2>
        <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Propose a learning session with {partner.displayName || partner.display_name || partner.name}
        </p>

        {/* Skill */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'var(--color-text)',
            fontWeight: '500'
          }}>
            🎯 What skill do you want to learn? *
          </label>
          <input
            type="text"
            value={formData.skill}
            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
            placeholder="e.g., JavaScript, Guitar, Spanish, Cooking"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '16px'
            }}
          />
          <small style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            Choose a skill that {partner.displayName || partner.display_name || partner.name} can teach you
          </small>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'var(--color-text)',
            fontWeight: '500'
          }}>
            📅 Preferred Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={getTodayDate()}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Time */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'var(--color-text)',
            fontWeight: '500'
          }}>
            🕐 Preferred Time *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'var(--color-text)',
            fontWeight: '500'
          }}>
            📝 Additional Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any specific topics you want to focus on, meeting preferences (online/in-person), or other details..."
            rows="4"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/matches')}
            style={{
              flex: '1',
              padding: '16px',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.skill || !formData.date || !formData.time}
            style={{
              flex: '2',
              padding: '16px',
              backgroundColor: loading || !formData.skill || !formData.date || !formData.time ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !formData.skill || !formData.date || !formData.time ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '📤 Sending Request...' : '📤 Send Session Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposeSession;