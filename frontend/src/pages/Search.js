import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Search.css';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('teach');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await api.get('/skills/search', {
        params: {
          skillName: searchTerm,
          type: searchType
        }
      });
      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="search-page">
        <h1>Search Users</h1>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-inputs">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="input"
              style={{ maxWidth: '200px' }}
            >
              <option value="teach">Can Teach</option>
              <option value="learn">Want to Learn</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter skill name..."
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="results-header">
            <h2>Found {results.length} user(s)</h2>
          </div>
        )}

        {loading ? (
          <p>Searching...</p>
        ) : results.length === 0 && searchTerm ? (
          <div className="empty-state">
            <p>No users found matching your search.</p>
          </div>
        ) : !searchTerm ? (
          <div className="empty-state">
            <p>Enter a skill name to search for users.</p>
          </div>
        ) : (
          <div className="users-grid">
            {results.map((user) => (
              <div key={user.uid} className="user-card">
                <h3>{user.displayName}</h3>
                {user.bio && <p className="user-bio">{user.bio}</p>}
                <div className="user-rating">
                  <span>Rating: {user.rating || 0}/5</span>
                  <span>({user.totalRatings || 0} reviews)</span>
                </div>
                <div className="user-skills">
                  <div>
                    <strong>Can Teach:</strong>
                    <ul>
                      {user.skillsToTeach.slice(0, 3).map((skill, idx) => (
                        <li key={idx}>{skill.skillName}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Wants to Learn:</strong>
                    <ul>
                      {user.skillsToLearn.slice(0, 3).map((skill, idx) => (
                        <li key={idx}>{skill.skillName}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="user-actions">
                  <Link to={`/profile/${user.uid}`} className="btn btn-primary">
                    View Profile
                  </Link>
                  <Link to={`/chats/${user.uid}`} className="btn btn-secondary">
                    Message
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

export default Search;

