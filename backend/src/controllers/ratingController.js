const { supabase } = require('../config/firebase');

/**
 * Submit a rating
 */
const submitRating = async (req, res) => {
  try {
    const { sessionId, ratedUserId, rating, review } = req.body;
    const raterId = req.user.uid;

    if (!sessionId || !ratedUserId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, rated user ID, and rating are required'
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

    // Verify session exists and is completed
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (sessionData.proposer_id !== raterId && sessionData.partner_id !== raterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate sessions you participated in'
      });
    }

    // Check if session is completed
    if (sessionData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate completed sessions'
      });
    }

    // Verify the rated user is the other participant
    const expectedRatedUserId = sessionData.proposer_id === raterId ? sessionData.partner_id : sessionData.proposer_id;
    if (ratedUserId !== expectedRatedUserId) {
      return res.status(400).json({
        success: false,
        message: 'You can only rate your session partner'
      });
    }

    // Check if rating already exists for this session and rater
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('rater_id', raterId)
      .single();

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this session'
      });
    }

    // Insert rating
    const { data: ratingData, error } = await supabase
      .from('ratings')
      .insert({
        session_id: sessionId,
        rater_id: raterId,
        rated_user_id: ratedUserId,
        rating: rating,
        review: review || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's average rating
    const { data: userRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user_id', ratedUserId);

    if (userRatings && userRatings.length > 0) {
      const totalRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / userRatings.length;
      
      await supabase
        .from('users')
        .update({
          rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          total_ratings: userRatings.length
        })
        .eq('uid', ratedUserId);
    }

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

/**
 * Get ratings for a user
 */
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:users!ratings_rater_id_fkey(display_name),
        session:sessions(skill, session_datetime)
      `)
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: ratings || [],
      count: ratings?.length || 0
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings'
    });
  }
};

module.exports = {
  submitRating,
  getUserRatings
};