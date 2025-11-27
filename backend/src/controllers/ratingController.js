const { supabase } = require('../config/firebase');

/**
 * Submit a rating
 */
const submitRating = async (req, res) => {
  try {
    const { ratedUserId, rating, comment } = req.body;
    const raterId = req.user.uid;

    if (!ratedUserId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Rated user ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (raterId === ratedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate yourself'
      });
    }

    // Insert rating
    const { data: ratingData, error } = await supabase
      .from('ratings')
      .insert({
        rater_id: raterId,
        rated_user_id: ratedUserId,
        rating: rating,
        comment: comment || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: ratingData
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting rating'
    });
  }
};

module.exports = {
  submitRating
};