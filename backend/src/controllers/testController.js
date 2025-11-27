const { supabase } = require('../config/firebase');

const testDatabase = async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('uid, display_name')
      .limit(5);
    
    console.log('Users query result:', { users, usersError });
    
    // Test messages table
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    console.log('Messages query result:', { messages, messagesError });
    
    // Test chats table
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(5);
    
    console.log('Chats query result:', { chats, chatsError });
    
    res.json({
      success: true,
      data: {
        users: { count: users?.length || 0, error: usersError },
        messages: { count: messages?.length || 0, error: messagesError },
        chats: { count: chats?.length || 0, error: chatsError }
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
};

module.exports = { testDatabase };