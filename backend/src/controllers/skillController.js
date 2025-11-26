const { supabase } = require('../config/firebase');

/**
 * Search users by skill
 * FR 3.1: Search by Skill
 */
const searchBySkill = async (req, res) => {
  try {
    const { skillName, type } = req.query; // type: 'teach' or 'learn'
    const userId = req.user.uid;

    if (!skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    const skillNameLower = skillName.toLowerCase();
    
    // Get all users except current user
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('uid', userId);

    if (error) {
      throw error;
    }

    const matchingUsers = [];

    users.forEach(userData => {
      const skills = type === 'learn' 
        ? (userData.skills_to_teach || [])
        : (userData.skills_to_learn || []);

      const hasSkill = skills.some(skill => 
        skill.skillName.toLowerCase().includes(skillNameLower)
      );

      if (hasSkill) {
        matchingUsers.push({
          uid: userData.uid,
          displayName: userData.display_name,
          email: userData.email,
          bio: userData.bio,
          photoURL: userData.photo_url,
          skillsToTeach: userData.skills_to_teach || [],
          skillsToLearn: userData.skills_to_learn || [],
          rating: userData.rating || 0,
          totalRatings: userData.total_ratings || 0
        });
      }
    });

    res.json({
      success: true,
      data: matchingUsers,
      count: matchingUsers.length
    });
  } catch (error) {
    console.error('Search by skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

/**
 * Get automatic matches
 * FR 3.2: Automatic Matching
 */
const getMatches = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skillsToLearn = (userData.skills_to_learn || []).map(s => s.skillName.toLowerCase());
    const skillsToTeach = (userData.skills_to_teach || []).map(s => s.skillName.toLowerCase());

    if (skillsToLearn.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Add skills you want to learn to get matches'
      });
    }

    // Get all other users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('uid', userId);

    if (error) {
      throw error;
    }

    const matches = [];

    users.forEach(otherUserData => {
      const otherSkillsToTeach = (otherUserData.skills_to_teach || []).map(s => s.skillName.toLowerCase());
      const otherSkillsToLearn = (otherUserData.skills_to_learn || []).map(s => s.skillName.toLowerCase());

      // Find matching skills
      const matchingTeachSkills = skillsToLearn.filter(skill => 
        otherSkillsToTeach.includes(skill)
      );
      const matchingLearnSkills = skillsToTeach.filter(skill => 
        otherSkillsToLearn.includes(skill)
      );

      // Calculate match score
      const matchScore = matchingTeachSkills.length + matchingLearnSkills.length;

      if (matchScore > 0) {
        matches.push({
          uid: otherUserData.uid,
          displayName: otherUserData.display_name,
          email: otherUserData.email,
          bio: otherUserData.bio,
          photoURL: otherUserData.photo_url,
          skillsToTeach: otherUserData.skills_to_teach || [],
          skillsToLearn: otherUserData.skills_to_learn || [],
          rating: otherUserData.rating || 0,
          totalRatings: otherUserData.total_ratings || 0,
          matchScore: matchScore,
          matchingSkills: {
            theyCanTeach: matchingTeachSkills,
            theyWantToLearn: matchingLearnSkills
          }
        });
      }
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: matches,
      count: matches.length
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting matches'
    });
  }
};

/**
 * Get all users (for browsing)
 */
const getAllUsers = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get all users except current user
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('uid', userId);

    if (error) {
      throw error;
    }

    const formattedUsers = users.map(userData => ({
      uid: userData.uid,
      displayName: userData.display_name,
      email: userData.email,
      bio: userData.bio,
      photoURL: userData.photo_url,
      skillsToTeach: userData.skills_to_teach || [],
      skillsToLearn: userData.skills_to_learn || [],
      rating: userData.rating || 0,
      totalRatings: userData.total_ratings || 0
    }));

    res.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

module.exports = {
  searchBySkill,
  getMatches,
  getAllUsers
};

