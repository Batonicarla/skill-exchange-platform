const { supabase } = require('../config/firebase');

/**
 * Propose a session
 * FR 5.1: Propose Session
 */
const proposeSession = async (req, res) => {
  try {
    const { partnerEmail, proposedDate, proposedTime, skill, duration, location, notes } = req.body;
    const proposerId = req.user.uid;

    console.log('Propose session request:', req.body);

    if (!partnerEmail || !proposedDate || !proposedTime || !skill) {
      return res.status(400).json({
        success: false,
        message: 'Partner email, date, time, and skill are required',
        received: { partnerEmail, proposedDate, proposedTime, skill }
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

    // Prepare session data - only include fields that exist in the table
    const sessionInsertData = {
      proposer_id: proposerId,
      partner_id: partnerId,
      skill: skill.trim(),
      proposed_date: proposedDate,
      proposed_time: proposedTime,
      session_datetime: sessionDateTime.toISOString(),
      notes: notes || '',
      status: 'pending'
    };

    // Only add duration and location if they were provided (for backward compatibility)
    if (duration !== undefined) {
      sessionInsertData.duration = duration || 60;
    }
    if (location !== undefined) {
      sessionInsertData.location = location || '';
    }

    const { data: sessionData, error } = await supabase
      .from('sessions')
      .insert(sessionInsertData)
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

    // Check if user is the partner (not the proposer)
    if (sessionData.partner_id !== userId) {
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

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // If session is confirmed, automatically create/ensure chat exists
    if (newStatus === 'confirmed') {
      const participant1 = sessionData.proposer_id;
      const participant2 = sessionData.partner_id;
      
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .or(`and(participant1.eq.${participant1},participant2.eq.${participant2}),and(participant1.eq.${participant2},participant2.eq.${participant1})`)
        .single();

      if (!existingChat) {
        // Create new chat
        await supabase
          .from('chats')
          .insert({
            participant1,
            participant2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    // Get updated session data to return
    const { data: updatedSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated session:', fetchError);
    }

    res.json({
      success: true,
      message: `Session ${newStatus} successfully${newStatus === 'confirmed' ? '. You can now chat with your learning partner!' : ''}`,
      data: {
        sessionId,
        status: newStatus,
        session: updatedSession
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
    const { status } = req.query;

    // Get sessions where user is proposer
    let proposerQuery = supabase
      .from('sessions')
      .select('*')
      .eq('proposer_id', userId);
    
    if (status) {
      proposerQuery = proposerQuery.eq('status', status);
    }

    const { data: proposerSessions } = await proposerQuery;

    // Get sessions where user is partner
    let partnerQuery = supabase
      .from('sessions')
      .select('*')
      .eq('partner_id', userId);
    
    if (status) {
      partnerQuery = partnerQuery.eq('status', status);
    }

    const { data: partnerSessions } = await partnerQuery;

    const sessions = [];

    // Process proposer sessions (user is learning)
    for (const session of proposerSessions || []) {
      // Get partner (teacher) info
      const { data: partnerData } = await supabase
        .from('users')
        .select('display_name')
        .eq('uid', session.partner_id)
        .single();

      sessions.push({
        sessionId: session.id,
        skill: session.skill,
        proposedDate: session.proposed_date,
        proposedTime: session.proposed_time,
        notes: session.notes,
        status: session.status,
        createdAt: session.created_at,
        role: 'proposer',
        proposerId: session.proposer_id,
        partnerId: session.partner_id,
        partnerName: partnerData?.display_name || 'Unknown'
      });
    }

    // Process partner sessions (user is teaching)
    for (const session of partnerSessions || []) {
      // Get proposer (student) info
      const { data: proposerData } = await supabase
        .from('users')
        .select('display_name')
        .eq('uid', session.proposer_id)
        .single();

      sessions.push({
        sessionId: session.id,
        skill: session.skill,
        proposedDate: session.proposed_date,
        proposedTime: session.proposed_time,
        notes: session.notes,
        status: session.status,
        createdAt: session.created_at,
        role: 'partner',
        proposerId: session.proposer_id,
        partnerId: session.partner_id,
        partnerName: proposerData?.display_name || 'Unknown'
      });
    }

    // Sort by session date
    sessions.sort((a, b) => {
      const dateA = new Date(a.proposedDate + 'T' + a.proposedTime);
      const dateB = new Date(b.proposedDate + 'T' + b.proposedTime);
      return dateA - dateB;
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

    // Get session from Supabase
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
    if (sessionData.proposer_id !== userId && sessionData.partner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Determine user's role and get partner info
    const isProposer = sessionData.proposer_id === userId;
    const partnerId = isProposer ? sessionData.partner_id : sessionData.proposer_id;

    // Get partner details
    const { data: partnerData } = await supabase
      .from('users')
      .select('uid, display_name, email, bio, photo_url')
      .eq('uid', partnerId)
      .single();

    res.json({
      success: true,
      data: {
        sessionId: sessionData.id,
        skill: sessionData.skill,
        proposedDate: sessionData.proposed_date,
        proposedTime: sessionData.proposed_time,
        notes: sessionData.notes,
        status: sessionData.status,
        createdAt: sessionData.created_at,
        respondedAt: sessionData.responded_at,
        role: isProposer ? 'proposer' : 'partner',
        proposerId: sessionData.proposer_id,
        partnerId: sessionData.partner_id,
        partner: partnerData ? {
          uid: partnerData.uid,
          displayName: partnerData.display_name,
          email: partnerData.email,
          bio: partnerData.bio,
          photoURL: partnerData.photo_url
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

    // Get session from Supabase
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
    if (sessionData.proposer_id !== userId && sessionData.partner_id !== userId) {
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

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

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

/**
 * Mark a session as completed
 */
const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    // Get session from Supabase
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
    if (sessionData.proposer_id !== userId && sessionData.partner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (sessionData.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed sessions can be marked as completed'
      });
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Session marked as completed! You can now rate your partner.'
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing session'
    });
  }
};

/**
 * Check if user can rate a session
 */
const canRateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;

    // Get session from Supabase
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
    if (sessionData.proposer_id !== userId && sessionData.partner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if session is completed
    if (sessionData.status !== 'completed') {
      return res.json({
        success: false,
        canRate: false,
        message: 'Session must be completed before rating'
      });
    }

    // Check if user has already rated this session
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('rater_id', userId)
      .single();

    if (existingRating) {
      return res.json({
        success: true,
        canRate: false,
        message: 'You have already rated this session'
      });
    }

    res.json({
      success: true,
      canRate: true,
      message: 'You can rate this session'
    });
  } catch (error) {
    console.error('Can rate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking rating eligibility'
    });
  }
};

module.exports = {
  proposeSession,
  respondToSession,
  getUserSessions,
  getSessionDetails,
  cancelSession,
  completeSession,
  canRateSession
};

