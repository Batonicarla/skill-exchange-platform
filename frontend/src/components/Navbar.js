import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            Skill Exchange
          </Link>
          
          {currentUser ? (
            <div className="navbar-menu">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/matches">Matches</Link>
              <Link to="/search">Search</Link>
              <Link to="/chats">Chats</Link>
              <Link to="/sessions">Sessions</Link>
              <Link to="/ratings">Rate</Link>
              <Link to="/profile">Profile</Link>
              {userData?.role === 'admin' && (
                <Link to="/admin">Admin</Link>
              )}
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <FiMoon /> : <FiSun />}
                <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>
              </button>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <div className="navbar-menu">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <FiMoon /> : <FiSun />}
                <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

