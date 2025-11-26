import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1>Skill Exchange Platform</h1>
          <p className="hero-subtitle">
            Exchange skills without monetary barriers. Learn from others and teach what you know.
          </p>
          {!currentUser && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Login
              </Link>
            </div>
          )}
          {currentUser && (
            <div className="hero-actions">
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>1. Create Profile</h3>
              <p>List the skills you can teach and the skills you want to learn.</p>
            </div>
            <div className="feature-card">
              <h3>2. Get Matched</h3>
              <p>Our system matches you with users who have complementary skills.</p>
            </div>
            <div className="feature-card">
              <h3>3. Connect & Learn</h3>
              <p>Chat with matches, schedule sessions, and exchange knowledge.</p>
            </div>
            <div className="feature-card">
              <h3>4. Rate & Review</h3>
              <p>Share feedback after sessions to build trust in the community.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="benefits-section">
        <div className="container">
          <h2>Benefits</h2>
          <ul className="benefits-list">
            <li>✓ Increase access to affordable learning</li>
            <li>✓ Encourage students to share knowledge</li>
            <li>✓ Build stronger learning communities</li>
            <li>✓ No monetary barriers</li>
            <li>✓ Peer-to-peer collaboration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;

