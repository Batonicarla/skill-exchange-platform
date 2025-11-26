import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { userData, updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    photoURL: ''
  });
  const [skillsToTeach, setSkillsToTeach] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', type: 'teach' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        bio: userData.bio || '',
        photoURL: userData.photoURL || ''
      });
      setSkillsToTeach(userData.skillsToTeach || []);
      setSkillsToLearn(userData.skillsToLearn || []);
    }
  }, [userData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put('/users/profile', formData);
      if (response.data.success) {
        updateUserData(response.data.data);
        setMessage('Profile updated successfully!');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = newSkill.type === 'teach' 
        ? '/users/skills/teach' 
        : '/users/skills/learn';
      
      const response = await api.post(endpoint, {
        skillName: newSkill.name,
        description: newSkill.description
      });

      if (response.data.success) {
        if (newSkill.type === 'teach') {
          setSkillsToTeach([...skillsToTeach, response.data.data]);
        } else {
          setSkillsToLearn([...skillsToLearn, response.data.data]);
        }
        setNewSkill({ name: '', description: '', type: 'teach' });
        setMessage('Skill added successfully!');
        
        // Refresh user data
        const userResponse = await api.get('/auth/me');
        if (userResponse.data.success) {
          updateUserData(userResponse.data.data);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillName, type) => {
    setLoading(true);
    setMessage('');

    try {
      const endpoint = type === 'teach'
        ? `/users/skills/teach/${encodeURIComponent(skillName)}`
        : `/users/skills/learn/${encodeURIComponent(skillName)}`;
      
      const response = await api.delete(endpoint);

      if (response.data.success) {
        if (type === 'teach') {
          setSkillsToTeach(skillsToTeach.filter(s => s.skillName !== skillName));
        } else {
          setSkillsToLearn(skillsToLearn.filter(s => s.skillName !== skillName));
        }
        setMessage('Skill removed successfully!');
        
        // Refresh user data
        const userResponse = await api.get('/auth/me');
        if (userResponse.data.success) {
          updateUserData(userResponse.data.data);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error removing skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="profile-page">
        <h1>My Profile</h1>
        
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="profile-section">
          <h2>Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input"
                rows="4"
                maxLength="500"
              />
            </div>
            <div className="form-group">
              <label>Photo URL</label>
              <input
                type="url"
                value={formData.photoURL}
                onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                className="input"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Add Skill</h2>
          <form onSubmit={handleAddSkill} className="skill-form">
            <div className="form-group">
              <label>Skill Type</label>
              <select
                value={newSkill.type}
                onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                className="input"
              >
                <option value="teach">I Can Teach</option>
                <option value="learn">I Want to Learn</option>
              </select>
            </div>
            <div className="form-group">
              <label>Skill Name</label>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="input"
                required
                placeholder="e.g., JavaScript, Guitar, Cooking"
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                className="input"
                rows="3"
                placeholder="Brief description of your skill level or what you're looking for"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Add Skill
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Skills I Can Teach</h2>
          {skillsToTeach.length === 0 ? (
            <p className="empty-message">No skills added yet. Add skills above!</p>
          ) : (
            <div className="skills-list">
              {skillsToTeach.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div>
                    <h3>{skill.skillName}</h3>
                    {skill.description && <p>{skill.description}</p>}
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.skillName, 'teach')}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Skills I Want to Learn</h2>
          {skillsToLearn.length === 0 ? (
            <p className="empty-message">No skills added yet. Add skills above!</p>
          ) : (
            <div className="skills-list">
              {skillsToLearn.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div>
                    <h3>{skill.skillName}</h3>
                    {skill.description && <p>{skill.description}</p>}
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.skillName, 'learn')}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

