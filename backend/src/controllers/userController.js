const { supabase } = require('../config/firebase');

/**
 * Get user profile by ID
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', userId)
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
        rating: userData.rating || 0,
        totalRatings: userData.total_ratings || 0
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

/**
 * Update user profile
 * FR 2.3: Edit Profile Info
 */
const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, photoURL } = req.body;
    const userId = req.user.uid;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (displayName !== undefined) updateData.display_name = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (photoURL !== undefined) updateData.photo_url = photoURL;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('uid')
      .eq('uid', userId)
      .single();

    if (!existingUser) {
      // Create user profile if it doesn't exist
      const newProfile = {
        uid: userId,
        email: req.user.email || '',
        display_name: displayName || '',
        bio: bio || '',
        photo_url: photoURL || '',
        skills_to_teach: [],
        skills_to_learn: [],
        role: 'user',
        rating: 0,
        total_ratings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Profile created successfully',
        data: {
          uid: data.uid,
          email: data.email,
          displayName: data.display_name,
          bio: data.bio,
          photoURL: data.photo_url,
          skillsToTeach: data.skills_to_teach || [],
          skillsToLearn: data.skills_to_learn || [],
          role: data.role,
          rating: data.rating || 0,
          totalRatings: data.total_ratings || 0
        }
      });
    }

    // Update existing profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('uid', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        uid: data.uid,
        email: data.email,
        displayName: data.display_name,
        bio: data.bio,
        photoURL: data.photo_url,
        skillsToTeach: data.skills_to_teach || [],
        skillsToLearn: data.skills_to_learn || [],
        role: data.role,
        rating: data.rating || 0,
        totalRatings: data.total_ratings || 0
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

/**
 * Add skill to teach
 * FR 2.1: Add Skills to Teach
 */
const addSkillToTeach = async (req, res) => {
  try {
    const { skillName, description, level } = req.body;
    const userId = req.user.uid;

    if (!skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('skills_to_teach')
      .eq('uid', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newSkill = {
      skillName: skillName.trim(),
      description: description || '',
      level: level || 'intermediate',
      addedAt: new Date().toISOString()
    };

    // Check if skill already exists
    const existingSkills = userData.skills_to_teach || [];
    const skillExists = existingSkills.some(s => 
      s.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (skillExists) {
      return res.status(400).json({
        success: false,
        message: 'Skill already exists in your teaching list'
      });
    }

    // Update skills array
    const updatedSkills = [...existingSkills, newSkill];

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        skills_to_teach: updatedSkills,
        updated_at: new Date().toISOString()
      })
      .eq('uid', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: newSkill
    });
  } catch (error) {
    console.error('Add skill to teach error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill'
    });
  }
};

/**
 * Add skill to learn
 * FR 2.2: Add Skills to Learn
 */
const addSkillToLearn = async (req, res) => {
  try {
    const { skillName, description, level } = req.body;
    const userId = req.user.uid;

    if (!skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('skills_to_learn')
      .eq('uid', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newSkill = {
      skillName: skillName.trim(),
      description: description || '',
      level: level || 'beginner',
      addedAt: new Date().toISOString()
    };

    // Check if skill already exists
    const existingSkills = userData.skills_to_learn || [];
    const skillExists = existingSkills.some(s => 
      s.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (skillExists) {
      return res.status(400).json({
        success: false,
        message: 'Skill already exists in your learning list'
      });
    }

    // Update skills array
    const updatedSkills = [...existingSkills, newSkill];

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        skills_to_learn: updatedSkills,
        updated_at: new Date().toISOString()
      })
      .eq('uid', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: newSkill
    });
  } catch (error) {
    console.error('Add skill to learn error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill'
    });
  }
};

/**
 * Remove skill from teach list
 */
const removeSkillToTeach = async (req, res) => {
  try {
    const { skillName } = req.params;
    const userId = req.user.uid;

    // Get current skills
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('skills_to_teach')
      .eq('uid', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skillsToTeach = userData.skills_to_teach || [];
    const filteredSkills = skillsToTeach.filter(
      s => s.skillName.toLowerCase() !== skillName.toLowerCase()
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({
        skills_to_teach: filteredSkills,
        updated_at: new Date().toISOString()
      })
      .eq('uid', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing skill'
    });
  }
};

/**
 * Remove skill from learn list
 */
const removeSkillToLearn = async (req, res) => {
  try {
    const { skillName } = req.params;
    const userId = req.user.uid;

    // Get current skills
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('skills_to_learn')
      .eq('uid', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skillsToLearn = userData.skills_to_learn || [];
    const filteredSkills = skillsToLearn.filter(
      s => s.skillName.toLowerCase() !== skillName.toLowerCase()
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({
        skills_to_learn: filteredSkills,
        updated_at: new Date().toISOString()
      })
      .eq('uid', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing skill'
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  addSkillToTeach,
  addSkillToLearn,
  removeSkillToTeach,
  removeSkillToLearn
};

