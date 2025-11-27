import api from './api';

class ChatManager {
  constructor() {
    this.activeChats = new Map();
    this.messageListeners = new Map();
    this.pollInterval = null;
  }

  // Start chat with a user
  async startChat(partnerId) {
    const chatId = this.generateChatId(partnerId);
    
    if (!this.activeChats.has(chatId)) {
      this.activeChats.set(chatId, {
        partnerId,
        messages: [],
        lastFetch: new Date(),
        isActive: true
      });
    }
    
    await this.loadMessages(partnerId);
    this.startPolling(partnerId);
    return chatId;
  }

  // Generate consistent chat ID
  generateChatId(partnerId) {
    const currentUserId = localStorage.getItem('userId') || 'user';
    return [currentUserId, partnerId].sort().join('_');
  }

  // Load messages for a chat
  async loadMessages(partnerId) {
    try {
      const response = await api.get(`/chat/history/${partnerId}`);
      const chatId = this.generateChatId(partnerId);
      
      if (response.data.success) {
        const chat = this.activeChats.get(chatId);
        if (chat) {
          chat.messages = response.data.data || [];
          chat.lastFetch = new Date();
          this.notifyListeners(chatId, chat.messages);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Send a message
  async sendMessage(partnerId, message) {
    try {
      const response = await api.post('/chat/send', {
        receiverId: partnerId,
        message: message.trim()
      });

      if (response.data.success) {
        const chatId = this.generateChatId(partnerId);
        const chat = this.activeChats.get(chatId);
        
        if (chat) {
          const newMessage = {
            sender_id: localStorage.getItem('userId'),
            receiver_id: partnerId,
            message: message.trim(),
            created_at: new Date().toISOString()
          };
          
          chat.messages.push(newMessage);
          this.notifyListeners(chatId, chat.messages);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Get all user chats
  async getUserChats() {
    try {
      const response = await api.get('/chat/chats');
      if (response.data.success) {
        return response.data.data || [];
      }
    } catch (error) {
      console.error('Error getting user chats:', error);
    }
    return [];
  }

  // Subscribe to message updates
  subscribe(chatId, callback) {
    if (!this.messageListeners.has(chatId)) {
      this.messageListeners.set(chatId, new Set());
    }
    this.messageListeners.get(chatId).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(chatId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  // Notify all listeners of message updates
  notifyListeners(chatId, messages) {
    const listeners = this.messageListeners.get(chatId);
    if (listeners) {
      listeners.forEach(callback => callback(messages));
    }
  }

  // Start polling for new messages
  startPolling(partnerId) {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    this.pollInterval = setInterval(() => {
      this.loadMessages(partnerId);
    }, 3000); // Poll every 3 seconds
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Get messages for a chat
  getMessages(partnerId) {
    const chatId = this.generateChatId(partnerId);
    const chat = this.activeChats.get(chatId);
    return chat ? chat.messages : [];
  }

  // Close a chat
  closeChat(partnerId) {
    const chatId = this.generateChatId(partnerId);
    this.activeChats.delete(chatId);
    this.messageListeners.delete(chatId);
    this.stopPolling();
  }

  // Cleanup all chats
  cleanup() {
    this.activeChats.clear();
    this.messageListeners.clear();
    this.stopPolling();
  }
}

// Create singleton instance
const chatManager = new ChatManager();
export default chatManager;