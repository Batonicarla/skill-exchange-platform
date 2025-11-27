const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Submit a rating and review
 * FR 6.1: Submit Rating, FR 6.2: Write Review
 */
const submitRating = async (req, res) => {
  try {
    const { sessionId, partnerId, rating, review } = req.body;
    const userId = req.user.uid;

    if (!sessionId || !partnerId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, partner ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (userId === partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate yourself'
      });
    }

    // Check if session exists and user participated
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

    if (sessionData.proposer_id !== userId && sessionData.partner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You did not participate in this session'
      });
    }

    if (sessionData.proposer_id !== partnerId && sessionData.partner_id !== partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID does not match session'
      });
    }

    // Check if user already rated this session
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('rater_id', userId)
      .single();

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this session'
      });
    }

    // Create rating
    const { data: ratingData, error: ratingError } = await supabase
      .from('ratings')
      .insert({
        session_id: sessionId,
        rater_id: userId,
        rated_user_id: partnerId,
        rating: parseInt(rating),
        review: review || ''
      })
      .select()
      .single();

    if (ratingError) throw ratingError;

    // Update partner's average rating
    const { data: partnerRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user_id', partnerId);

    const totalRating = partnerRatings?.reduce((sum, r) => sum + r.rating, 0) || 0;
    const count = partnerRatings?.length || 0;
    const averageRating = count > 0 ? totalRating / count : 0;

    await supabase
      .from('users')
      .update({
        rating: Math.round(averageRating * 10) / 10,
        total_ratings: count
      })
      .eq('uid', partnerId);

    res.status(201).json({
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

    const ratingsSnapshot = await db.collection('ratings')
      .where('ratedUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const ratings = [];

    for (const doc of ratingsSnapshot.docs) {
      const ratingData = doc.data();
      
      // Get rater info
      const raterDoc = await db.collection('users').doc(ratingData.raterId).get();
      const raterData = raterDoc.exists ? raterDoc.data() : null;

      // Get session info
      const sessionDoc = await db.collection('sessions').doc(ratingData.sessionId).get();
      const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

      ratings.push({
        ratingId: doc.id,
        rating: ratingData.rating,
        review: ratingData.review,
        createdAt: ratingData.createdAt.toDate(),
        rater: raterData ? {
          uid: ratingData.raterId,
          displayName: raterData.displayName,
          photoURL: raterData.photoURL
        } : null,
        session: sessionData ? {
          sessionId: ratingData.sessionId,
          skill: sessionData.skill
        } : null
      });
    }

    res.json({
      success: true,
      data: ratings,
      count: ratings.length
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

