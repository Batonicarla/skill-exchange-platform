const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Send a message
 * FR 4.1: Send & Receive Messages
 */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.uid;

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

    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim()
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Check if chat exists
    const { data: existingChat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .single();

    if (!existingChat) {
      // Create chat
      await supabase
        .from('chats')
        .insert({
          id: chatId,
          participants: [senderId, receiverId],
          last_message: message.trim(),
          last_message_time: new Date().toISOString()
        });
    } else {
      // Update chat
      await supabase
        .from('chats')
        .update({
          last_message: message.trim(),
          last_message_time: new Date().toISOString()
        })
        .eq('id', chatId);
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
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

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
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

    // Get all chats where user is a participant
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId]);

    if (error) throw error;

    const chatList = [];

    for (const chat of chats || []) {
      const partnerId = chat.participants.find(id => id !== userId);
      
      // Get partner info
      const { data: partnerData } = await supabase
        .from('users')
        .select('uid, display_name, photo_url, email')
        .eq('uid', partnerId)
        .single();

      chatList.push({
        chatId: chat.id,
        partner: partnerData ? {
          uid: partnerId,
          displayName: partnerData.display_name,
          photoURL: partnerData.photo_url,
          email: partnerData.email
        } : null,
        lastMessage: chat.last_message,
        lastMessageTime: chat.last_message_time,
        unreadCount: 0
      });
    }

    // Sort by last message time
    chatList.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
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
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    
    // Get unread messages
    const snapshot = await messagesRef
      .where('receiverId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: snapshot.size
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

