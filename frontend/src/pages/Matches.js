import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Matches.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/skills/matches');
      if (response.data.success) {
        setMatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="matches-page">
        <h1>Your Matches</h1>
        <p className="page-description">
          These users have complementary skills - they can teach what you want to learn, 
          and want to learn what you can teach!
        </p>

        {loading ? (
          <p>Loading matches...</p>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <p>No matches found. Add skills you want to learn to get matched with other users!</p>
            <Link to="/profile" className="btn btn-primary">Update Profile</Link>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.uid} className="match-card">
                <div className="match-header">
                  <h3>{match.displayName}</h3>
                  <span className="match-score">Match Score: {match.matchScore}</span>
                </div>
                
                {match.bio && <p className="match-bio">{match.bio}</p>}
                
                <div className="match-rating">
                  <span>⭐ {match.rating ? match.rating.toFixed(1) : '0.0'}/5</span>
                  <span>({match.totalRatings || 0} reviews)</span>
                </div>

                <div className="match-skills">
                  {match.matchingSkills.theyCanTeach.length > 0 && (
                    <div className="skill-match">
                      <strong>They Can Teach You:</strong>
                      <ul>
                        {match.matchingSkills.theyCanTeach.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {match.matchingSkills.theyWantToLearn.length > 0 && (
                    <div className="skill-match">
                      <strong>They Want to Learn From You:</strong>
                      <ul>
                        {match.matchingSkills.theyWantToLearn.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="match-actions">
                  <Link to={`/profile/${match.uid}`} className="btn btn-primary">
                    View Profile
                  </Link>
                  <Link to={`/chats/${match.uid}`} className="btn btn-secondary">
                    💬 Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;

