import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: '@sharp_users_offline_v2',
  CURRENT_USER: '@sharp_current_user_offline_v2',
  TICKETS: '@sharp_tickets_offline_v2',
  NOTIFICATIONS: '@sharp_notifications_offline_v2',
};

const DEFAULT_USERS = [
  { id: 'AGT001', name: 'Sharp Agent 1', email: 'agent1@sharp.com', agentId: 'AGT001', role: 'agent' },
  { id: 'CUST001', name: 'Hema', email: 'hema@sharp.com', phone: '9380890221', role: 'customer' }
];

export const MockBackend = {
  isOnline: true,

  async getUsers() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_USERS;
    }
  },

  async registerOrLogin({ role, name, email, phone, agentId, password }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid normal email format (e.g. name@example.com)');
    }

    if (role === 'customer') {
      const phoneRegex = /^\d{10}$/;
      if (!phone || !phoneRegex.test(phone)) {
        throw new Error('Customer phone number must be exactly 10 digits.');
      }
    }

    if (role === 'agent') {
      if (!email.endsWith('@sharp.com')) {
        throw new Error('Agent email must be in the format agentname@sharp.com');
      }
      if (!agentId || !agentId.trim()) {
        throw new Error('Agent ID is required for agent login.');
      }
    }

    const users = await this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: role === 'agent' ? agentId.trim() : `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '',
        agentId: role === 'agent' ? agentId.trim() : '',
        role
      };
      users.push(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
      user.name = name.trim();
      user.role = role;
      if (role === 'agent' && agentId) {
        user.agentId = agentId.trim();
        user.id = agentId.trim();
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  async getCurrentUser() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async logoutUser() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {}
  },

  async getTickets() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveTickets(tickets) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    } catch (e) {}
  },

  async getNotifications() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addNotification(msg) {
    try {
      const notes = await this.getNotifications();
      const updated = [{ id: `${Date.now()}`, message: msg, time: new Date().toLocaleTimeString() }, ...notes];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {}
  },

  async createTicket(ticketData, currentUser) {
    const tickets = await this.getTickets();
    const nextId = 1001 + tickets.length;
    const newTicket = {
      id: `${nextId}`,
      status: 'OPEN',
      customerName: currentUser?.name || 'Customer',
      customerEmail: currentUser?.email || '',
      customerPhone: currentUser?.phone || '',
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      photoUris: ticketData.photoUris || [], // Array supporting multiple attached photos
      assignedAgent: null,
      quoteAmount: null,
      paymentStatus: 'PENDING',
      comments: [],
      rating: null,
      feedback: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTicket, ...tickets];
    await this.saveTickets(updated);
    await this.addNotification(`[FCM Alert] New Ticket #${newTicket.id} created.`);
    return updated;
  },

  async acceptTicket(ticketId, agentUser) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'IN_PROGRESS',
          assignedAgent: {
            name: agentUser.name,
            agentId: agentUser.agentId || agentUser.id,
            email: agentUser.email
          }
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    await this.addNotification(`[FCM Alert] Ticket #${ticketId} accepted by Agent ${agentUser.agentId || agentUser.id}.`);
    return updated;
  },

  async updateTicketStatus(ticketId, newStatus) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        if (newStatus === 'CLOSED' && t.paymentStatus !== 'SUCCESS') {
          throw new Error('Cannot close ticket. Payment must be completed first.');
        }
        return { ...t, status: newStatus };
      }
      return t;
    });
    await this.saveTickets(updated);
    await this.addNotification(`[FCM Alert] Ticket #${ticketId} status changed to ${newStatus}.`);
    return updated;
  },

  async setQuote(ticketId, amountInINR) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'QUOTE_PENDING',
          quoteAmount: amountInINR
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    await this.addNotification(`[FCM Alert] Quote of ₹${amountInINR} INR assigned to Ticket #${ticketId}.`);
    return updated;
  },

  async makePayment(ticketId) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          paymentStatus: 'SUCCESS',
          status: 'PAID'
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    await this.addNotification(`[FCM Alert] Payment received for Ticket #${ticketId}. Agent can now resolve & close.`);
    return updated;
  },

  async submitCsatRating(ticketId, ratingScore, feedbackText) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          rating: ratingScore,
          feedback: feedbackText
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    await this.addNotification(`[CSAT] Customer submitted ${ratingScore}-Star rating for Ticket #${ticketId}.`);
    return updated;
  },

  async addComment(ticketId, commentText, senderName) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const comments = t.comments || [];
        return {
          ...t,
          comments: [...comments, { id: `${Date.now()}`, sender: senderName, text: commentText, time: new Date().toLocaleTimeString() }]
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    return updated;
  }
};