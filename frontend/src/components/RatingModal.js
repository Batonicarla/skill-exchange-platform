import React, { useState } from 'react';
import api from '../services/api';
import './RatingModal.css';

const RatingModal = ({ session, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with rating:', rating);
    
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting rating:', {
        sessionId: session.sessionId,
        ratedUserId: session.partnerId,
        rating,
        review
      });
      
      const response = await api.post('/ratings/submit', {
        sessionId: session.sessionId,
        ratedUserId: session.partnerId,
        rating,
        review
      });

      console.log('Rating response:', response.data);
      
      if (response.data.success) {
        alert('Rating submitted successfully!');
        onSubmit();
        onClose();
      }
    } catch (error) {
      console.error('Rating error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error submitting rating';
      if (error.response?.status === 404) {
        alert('Rating service not available. Please try again later.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate Your Session</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <label>Rating (1-5 stars)</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= rating ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Star clicked:', star);
                    setRating(star);
                  }}
                  onMouseEnter={() => console.log('Star hover:', star)}
                >
                  ★
                </button>
              ))}
            </div>
            <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px'}}>
              Current rating: {rating}/5
            </p>
          </div>

          <div className="form-group">
            <label>Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={rating === 0 || loading}
              onClick={(e) => {
                console.log('Submit button clicked');
                // Let the form handle the submission
              }}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;