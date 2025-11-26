const { db } = require('../config/firebase');

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
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionData = sessionDoc.data();
    if (sessionData.proposerId !== userId && sessionData.partnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You did not participate in this session'
      });
    }

    if (sessionData.proposerId !== partnerId && sessionData.partnerId !== partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID does not match session'
      });
    }

    // Check if user already rated this session
    const existingRating = await db.collection('ratings')
      .where('sessionId', '==', sessionId)
      .where('raterId', '==', userId)
      .get();

    if (!existingRating.empty) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this session'
      });
    }

    // Create rating document
    const ratingData = {
      sessionId,
      raterId: userId,
      ratedUserId: partnerId,
      rating: parseInt(rating),
      review: review || '',
      createdAt: new Date()
    };

    await db.collection('ratings').add(ratingData);

    // Update partner's average rating
    const partnerRatings = await db.collection('ratings')
      .where('ratedUserId', '==', partnerId)
      .get();

    let totalRating = 0;
    let count = 0;

    partnerRatings.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });

    const averageRating = count > 0 ? totalRating / count : 0;

    await db.collection('users').doc(partnerId).update({
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: count,
      updatedAt: new Date()
    });

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

