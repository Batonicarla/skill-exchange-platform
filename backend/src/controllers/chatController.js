const { db } = require('../config/firebase');

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

    const messageData = {
      senderId,
      receiverId,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    };

    // Add message to chat collection
    await db.collection('chats').doc(chatId).collection('messages').add(messageData);

    // Update chat metadata
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      // Create chat document
      await chatRef.set({
        participants: [senderId, receiverId],
        lastMessage: message.trim(),
        lastMessageTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update chat document
      await chatRef.update({
        lastMessage: message.trim(),
        lastMessageTime: new Date(),
        updatedAt: new Date()
      });
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
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    res.json({
      success: true,
      data: messages,
      count: messages.length
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
    const chatsRef = db.collection('chats');
    const snapshot = await chatsRef.where('participants', 'array-contains', userId).get();

    const chats = [];

    for (const doc of snapshot.docs) {
      const chatData = doc.data();
      const partnerId = chatData.participants.find(id => id !== userId);
      
      // Get partner info
      const partnerDoc = await db.collection('users').doc(partnerId).get();
      const partnerData = partnerDoc.exists ? partnerDoc.data() : null;

      chats.push({
        chatId: doc.id,
        partner: partnerData ? {
          uid: partnerId,
          displayName: partnerData.displayName,
          photoURL: partnerData.photoURL,
          email: partnerData.email
        } : null,
        lastMessage: chatData.lastMessage,
        lastMessageTime: chatData.lastMessageTime?.toDate(),
        unreadCount: 0 // Can be calculated by checking unread messages
      });
    }

    // Sort by last message time
    chats.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime - a.lastMessageTime;
    });

    res.json({
      success: true,
      data: chats,
      count: chats.length
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

