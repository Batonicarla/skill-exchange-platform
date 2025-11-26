import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { userData } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/skills/matches');
      if (response.data.success) {
        setMatches(response.data.data.slice(0, 6)); // Show top 6 matches
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <h1>Welcome, {userData?.displayName}!</h1>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Skills to Teach</h3>
            <p className="stat-number">{userData?.skillsToTeach?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Skills to Learn</h3>
            <p className="stat-number">{userData?.skillsToLearn?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Your Rating</h3>
            <p className="stat-number">{userData?.rating || 0}/5</p>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recommended Matches</h2>
            <Link to="/matches" className="btn btn-primary">View All</Link>
          </div>
          
          {loading ? (
            <p>Loading matches...</p>
          ) : matches.length === 0 ? (
            <div className="empty-state">
              <p>No matches found. Add skills you want to learn to get matched!</p>
              <Link to="/profile" className="btn btn-primary">Update Profile</Link>
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map((match) => (
                <div key={match.uid} className="match-card">
                  <h3>{match.displayName}</h3>
                  <p className="match-score">Match Score: {match.matchScore}</p>
                  <div className="match-skills">
                    <div>
                      <strong>Can Teach:</strong>
                      <ul>
                        {match.matchingSkills.theyCanTeach.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Wants to Learn:</strong>
                      <ul>
                        {match.matchingSkills.theyWantToLearn.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="match-actions">
                    <Link to={`/profile/${match.uid}`} className="btn btn-primary">
                      View Profile
                    </Link>
                    <Link to={`/chats/${match.uid}`} className="btn btn-secondary">
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <Link to="/profile" className="action-card">
            <h3>Update Profile</h3>
            <p>Add or edit your skills</p>
          </Link>
          <Link to="/search" className="action-card">
            <h3>Search Users</h3>
            <p>Find people by skill</p>
          </Link>
          <Link to="/sessions" className="action-card">
            <h3>My Sessions</h3>
            <p>View scheduled sessions</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

