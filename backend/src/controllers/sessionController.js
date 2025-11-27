const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Propose a session
 * FR 5.1: Propose Session
 */
const proposeSession = async (req, res) => {
  try {
    const { partnerEmail, proposedDate, proposedTime, skill, notes } = req.body;
    const proposerId = req.user.uid;

    if (!partnerEmail || !proposedDate || !proposedTime || !skill) {
      return res.status(400).json({
        success: false,
        message: 'Partner email, date, time, and skill are required'
      });
    }

    // Find partner by email
    const { data: partnerData, error: partnerError } = await supabase
      .from('users')
      .select('uid, email')
      .eq('email', partnerEmail.toLowerCase())
      .single();

    if (partnerError || !partnerData) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }

    const partnerId = partnerData.uid;

    if (proposerId === partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot propose session to yourself'
      });
    }

    // Combine date and time
    const sessionDateTime = new Date(`${proposedDate}T${proposedTime}`);

    if (sessionDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Session date and time must be in the future'
      });
    }

    const { data: sessionData, error } = await supabase
      .from('sessions')
      .insert({
        proposer_id: proposerId,
        partner_id: partnerId,
        skill: skill.trim(),
        proposed_date: proposedDate,
        proposed_time: proposedTime,
        session_datetime: sessionDateTime.toISOString(),
        notes: notes || '',
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Session proposed successfully',
      data: sessionData
    });
  } catch (error) {
    console.error('Propose session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error proposing session'
    });
  }
};

/**
 * Confirm or reject a session
 * FR 5.2: Confirm Session
 */
const respondToSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body; // 'confirm' or 'reject'
    const userId = req.user.uid;

    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "confirm" or "reject"'
      });
    }

    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is the partner (not the proposer)
    if (sessionData.partnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the partner can respond to this session'
      });
    }

    if (sessionData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Session is already ${sessionData.status}`
      });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    await sessionRef.update({
      status: newStatus,
      updatedAt: new Date(),
      respondedAt: new Date()
    });

    res.json({
      success: true,
      message: `Session ${newStatus} successfully`,
      data: {
        sessionId,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Respond to session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to session'
    });
  }
};

/**
 * Get user's sessions
 */
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status } = req.query; // Optional filter by status

    let query = db.collection('sessions')
      .where('proposerId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    // Also get sessions where user is the partner
    let partnerQuery = db.collection('sessions')
      .where('partnerId', '==', userId);

    if (status) {
      partnerQuery = partnerQuery.where('status', '==', status);
    }

    const partnerSnapshot = await partnerQuery.get();

    const sessions = [];

    // Process proposer sessions
    snapshot.forEach(doc => {
      const sessionData = doc.data();
      sessions.push({
        sessionId: doc.id,
        ...sessionData,
        sessionDateTime: sessionData.sessionDateTime?.toDate(),
        createdAt: sessionData.createdAt?.toDate(),
        updatedAt: sessionData.updatedAt?.toDate(),
        role: 'proposer'
      });
    });

    // Process partner sessions
    partnerSnapshot.forEach(doc => {
      const sessionData = doc.data();
      sessions.push({
        sessionId: doc.id,
        ...sessionData,
        sessionDateTime: sessionData.sessionDateTime?.toDate(),
        createdAt: sessionData.createdAt?.toDate(),
        updatedAt: sessionData.updatedAt?.toDate(),
        role: 'partner'
      });
    });

    // Sort by session date
    sessions.sort((a, b) => {
      if (!a.sessionDateTime) return 1;
      if (!b.sessionDateTime) return -1;
      return a.sessionDateTime - b.sessionDateTime;
    });

    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
};

/**
 * Get session details
 */
const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is part of this session
    if (sessionData.proposerId !== userId && sessionData.partnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get partner info
    const partnerId = sessionData.proposerId === userId 
      ? sessionData.partnerId 
      : sessionData.proposerId;

    const partnerDoc = await db.collection('users').doc(partnerId).get();
    const partnerData = partnerDoc.exists ? partnerDoc.data() : null;

    res.json({
      success: true,
      data: {
        sessionId: sessionDoc.id,
        ...sessionData,
        sessionDateTime: sessionData.sessionDateTime?.toDate(),
        createdAt: sessionData.createdAt?.toDate(),
        updatedAt: sessionData.updatedAt?.toDate(),
        partner: partnerData ? {
          uid: partnerId,
          displayName: partnerData.displayName,
          email: partnerData.email,
          photoURL: partnerData.photoURL
        } : null
      }
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session details'
    });
  }
};

/**
 * Cancel a session
 */
const cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionData = sessionDoc.data();

    // Check if user is part of this session
    if (sessionData.proposerId !== userId && sessionData.partnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (['cancelled', 'completed'].includes(sessionData.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${sessionData.status} session`
      });
    }

    await sessionRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
      cancelledAt: new Date(),
      cancelledBy: userId
    });

    res.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling session'
    });
  }
};

module.exports = {
  proposeSession,
  respondToSession,
  getUserSessions,
  getSessionDetails,
  cancelSession
};

