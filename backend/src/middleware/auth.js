const jwt = require('jsonwebtoken');
const { supabase } = require('../config/firebase');

/**
 * Middleware to verify Supabase JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization required.'
      });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      uid: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at !== null
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('uid', req.user.uid)
      .single();

    if (error || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying admin status'
    });
  }
};

module.exports = { verifyToken, verifyAdmin };

