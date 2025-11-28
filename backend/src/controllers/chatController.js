const { supabase } = require('../config/firebase');

/**
 * Send a message
 * FR 4.1: Send & Receive Messages
 */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.uid;

    console.log('Send message request:', { senderId, receiverId, message });

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Create chat ID (consistent regardless of sender/receiver order)
    const chatId = [senderId, receiverId].sort().join('_');
    console.log('Generated chat ID:', chatId);

    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim(),
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('Message insert error:', messageError);
      throw messageError;
    }

    console.log('Message inserted:', messageData);

    console.log('Message sent successfully');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

/**
 * Get chat history
 * FR 4.3: Store Chat History
 */
const getChatHistory = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.uid;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required'
      });
    }

    // Create chat ID
    const chatId = [userId, partnerId].sort().join('_');

    // Get messages between the two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: messages || [],
      count: messages?.length || 0
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history'
    });
  }
};

/**
 * Get all chats for current user
 */
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, message, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by conversation partner
    const conversations = new Map();
    
    for (const msg of messages || []) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          lastMessage: msg.message,
          lastMessageTime: msg.created_at
        });
      }
    }

    const chatList = [];
    
    for (const [partnerId, conversation] of conversations) {
      // Get partner info
      const { data: partnerData } = await supabase
        .from('users')
        .select('uid, display_name, photo_url, email')
        .eq('uid', partnerId)
        .single();

      chatList.push({
        chatId: [userId, partnerId].sort().join('_'),
        partner: partnerData ? {
          uid: partnerId,
          displayName: partnerData.display_name,
          photoURL: partnerData.photo_url,
          email: partnerData.email
        } : null,
        lastMessage: conversation.lastMessage,
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: 0
      });
    }

    // Sort by last message time
    chatList.sort((a, b) => {
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.json({
      success: true,
      data: chatList,
      count: chatList.length
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

/**
 * Mark messages as read
 */
const markAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.uid;

    const chatId = [userId, partnerId].sort().join('_');
    
    // Update unread messages
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getUserChats,
  markAsRead
};

