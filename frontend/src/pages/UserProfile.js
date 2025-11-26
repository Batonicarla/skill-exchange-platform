import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposeData, setProposeData] = useState({
    proposedDate: '',
    proposedTime: '',
    skill: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get(`/users/profile/${userId}`);
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await api.get(`/ratings/user/${userId}`);
      if (response.data.success) {
        setRatings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
    fetchRatings();
  }, [fetchUserProfile, fetchRatings]);

  const handleProposeSession = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await api.post('/sessions/propose', {
        partnerId: userId,
        ...proposeData
      });
      if (response.data.success) {
        setMessage('Session proposed successfully!');
        setShowProposeForm(false);
        setProposeData({
          proposedDate: '',
          proposedTime: '',
          skill: '',
          notes: ''
        });
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error proposing session');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>User not found</div>;
  }

  return (
    <div className="container">
      <div className="user-profile-page">
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          ← Back
        </button>

        <div className="profile-header">
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName} className="profile-photo" />
          )}
          <div>
            <h1>{user.displayName}</h1>
            <div className="profile-rating">
              <span className="rating-stars">⭐ {user.rating || 0}/5</span>
              <span>({user.totalRatings || 0} reviews)</span>
            </div>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
          </div>
        </div>

        <div className="profile-actions">
          <Link to={`/chats/${userId}`} className="btn btn-primary">
            Message
          </Link>
          <button
            onClick={() => setShowProposeForm(!showProposeForm)}
            className="btn btn-secondary"
          >
            {showProposeForm ? 'Cancel' : 'Propose Session'}
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
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Propose Session
              </button>
            </form>
          </div>
        )}

        <div className="profile-section">
          <h2>Skills I Can Teach</h2>
          {user.skillsToTeach?.length === 0 ? (
            <p className="empty-message">No skills listed</p>
          ) : (
            <div className="skills-list">
              {user.skillsToTeach?.map((skill, idx) => (
                <div key={idx} className="skill-item">
                  <h3>{skill.skillName}</h3>
                  {skill.description && <p>{skill.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Skills I Want to Learn</h2>
          {user.skillsToLearn?.length === 0 ? (
            <p className="empty-message">No skills listed</p>
          ) : (
            <div className="skills-list">
              {user.skillsToLearn?.map((skill, idx) => (
                <div key={idx} className="skill-item">
                  <h3>{skill.skillName}</h3>
                  {skill.description && <p>{skill.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Reviews ({ratings.length})</h2>
          {ratings.length === 0 ? (
            <p className="empty-message">No reviews yet</p>
          ) : (
            <div className="ratings-list">
              {ratings.map((rating) => (
                <div key={rating.ratingId} className="rating-item">
                  <div className="rating-header">
                    <strong>{rating.rater?.displayName || 'Anonymous'}</strong>
                    <span className="rating-stars">⭐ {rating.rating}/5</span>
                  </div>
                  {rating.review && <p>{rating.review}</p>}
                  {rating.session && (
                    <p className="rating-session">Skill: {rating.session.skill}</p>
                  )}
                  <p className="rating-date">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

