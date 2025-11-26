const { supabase } = require('../config/firebase');

/**
 * Login user with email and password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: authError.message
      });
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', authData.user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token: authData.session.access_token,
      data: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.display_name,
        bio: userData.bio,
        photoURL: userData.photo_url,
        skillsToTeach: userData.skills_to_teach || [],
        skillsToLearn: userData.skills_to_learn || [],
        role: userData.role,
        rating: userData.rating || 0,
        totalRatings: userData.total_ratings || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      });
    }

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Create user profile
    const userData = {
      uid: authData.user.id,
      email: authData.user.email,
      display_name: displayName,
      bio: '',
      photo_url: '',
      skills_to_teach: [],
      skills_to_learn: [],
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 0,
      total_ratings: 0
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert([userData]);

    if (insertError) {
      console.error('Profile creation error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile'
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: authData.session?.access_token,
      data: {
        uid: authData.user.id,
        email: authData.user.email,
        displayName: displayName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', req.user.uid)
      .single();
    
    if (error || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.display_name,
        bio: userData.bio,
        photoURL: userData.photo_url,
        skillsToTeach: userData.skills_to_teach || [],
        skillsToLearn: userData.skills_to_learn || [],
        role: userData.role,
        rating: userData.rating || 0,
        totalRatings: userData.total_ratings || 0
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  getCurrentUser
};