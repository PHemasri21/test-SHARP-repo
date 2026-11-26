import { LocalCache, TABLES } from '../storage/localCache';

const DEFAULT_USERS = [
  { id: 'AGT001', name: 'Sharp Agent 1', email: 'agent1@sharp.com', agentId: 'AGT001', role: 'agent' },
  { id: 'CUST001', name: 'Hema', email: 'hema@sharp.com', phone: '9380890221', role: 'customer' },
];

const SEED_DEMO_TICKETS = [
  {
    id: '1001',
    status: 'IN_PROGRESS',
    customerName: 'Hema',
    customerEmail: 'hema@sharp.com',
    customerPhone: '9380890221',
    category: 'Hardware Repair',
    priority: 'High',
    description: 'Laptop charging port is loose and disconnects when cable moves.',
    photoUris: [],
    assignedAgent: { name: 'Sharp Agent 1', agentId: 'AGT001', email: 'agent1@sharp.com' },
    quoteAmount: '1200',
    paymentStatus: 'PENDING',
    comments: [
      { id: 'c1', sender: 'Sharp Agent 1', text: 'Assigned and diagnostic check queued.', time: '10:15:00 AM' },
    ],
    rating: null,
    feedback: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

let createTicketLock = false;

export const MockBackend = {
  isOnline: true,
  simulatedOffline: false,

  setSimulatedOffline(offline) {
    this.simulatedOffline = Boolean(offline);
    this.isOnline = !this.simulatedOffline;
    return this.simulatedOffline;
  },

  isOfflineMode() {
    return this.simulatedOffline || !this.isOnline;
  },

  async getCacheStatus() {
    const meta = await LocalCache.getMeta(TABLES.TICKETS);
    return {
      isOffline: this.isOfflineMode(),
      simulatedOffline: this.simulatedOffline,
      lastUpdatedAt: meta?.lastUpdatedAt || null,
      recordCount: meta?.recordCount ?? 0,
    };
  },

  async seedDemoDataIfEmpty() {
    const existing = await LocalCache.select(TABLES.TICKETS, null, []);
    if (existing.length === 0) {
      await LocalCache.replaceAll(TABLES.TICKETS, SEED_DEMO_TICKETS);
      await this.addNotification('[Cache] Seeded offline demo ticket #1001.');
    }
    return this.getTickets();
  },

  async getUsers() {
    const users = await LocalCache.getObject(TABLES.USERS, null);
    if (!Array.isArray(users) || users.length === 0) {
      await LocalCache.setObject(TABLES.USERS, DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return users;
  },

  async registerOrLogin({ role, name, email, phone, agentId }) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName) throw new Error('Please enter your name.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address (e.g. name@example.com).');
    }

    if (role === 'customer') {
      const phoneRegex = /^\d{10}$/;
      if (!phone || !phoneRegex.test(phone.trim())) {
        throw new Error('Customer phone number must be exactly 10 digits.');
      }
    }

    if (role === 'agent') {
      if (!cleanEmail.endsWith('@sharp.com')) {
        throw new Error('Agent email must end with @sharp.com');
      }
      if (!agentId || !agentId.trim()) {
        throw new Error('Agent ID is required for agent login.');
      }
    }

    const users = await this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: role === 'agent' ? agentId.trim() : `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: cleanName,
        email: cleanEmail,
        phone: phone ? phone.trim() : '',
        agentId: role === 'agent' ? agentId.trim() : '',
        role,
      };
      users.push(user);
      await LocalCache.setObject(TABLES.USERS, users);
    } else {
      user = {
        ...user,
        name: cleanName,
        role,
        phone: role === 'customer' && phone ? phone.trim() : user.phone,
        agentId: role === 'agent' && agentId ? agentId.trim() : user.agentId,
        id: role === 'agent' && agentId ? agentId.trim() : user.id,
      };
      const nextUsers = users.map(u => (u.email.toLowerCase() === cleanEmail ? user : u));
      await LocalCache.setObject(TABLES.USERS, nextUsers);
    }

    await LocalCache.setObject(TABLES.SESSION, user);
    return user;
  },

  async getCurrentUser() {
    return LocalCache.getObject(TABLES.SESSION, null);
  },

  async logoutUser() {
    await LocalCache.remove(TABLES.SESSION);
  },

  async getTickets(filterFn = null) {
    const tickets = await LocalCache.select(TABLES.TICKETS, filterFn, []);
    return Array.isArray(tickets) ? tickets : [];
  },

  async saveTickets(tickets) {
    await LocalCache.replaceAll(TABLES.TICKETS, tickets);
  },

  async getNotifications() {
    return LocalCache.select(TABLES.NOTIFICATIONS, null, []);
  },

  async addNotification(msg) {
    const notes = await this.getNotifications();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      message: msg,
      time: new Date().toLocaleTimeString(),
      offlineSaved: this.isOfflineMode(),
    };
    const updated = [entry, ...notes].slice(0, 50); // Keep latest 50 to prevent bloat
    await LocalCache.replaceAll(TABLES.NOTIFICATIONS, updated);
  },

  async createTicket(ticketData, currentUser) {
    if (createTicketLock) {
      throw new Error('Ticket submission already in progress.');
    }
    createTicketLock = true;
    try {
      const tickets = await this.getTickets();
      const maxExistingId = tickets.reduce((max, t) => {
        const num = parseInt(t.id, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 1000);

      const newTicket = {
        id: `${maxExistingId + 1}`,
        status: 'OPEN',
        customerName: currentUser?.name || 'Customer',
        customerEmail: currentUser?.email || '',
        customerPhone: currentUser?.phone || '',
        category: ticketData.category || 'General',
        priority: ticketData.priority || 'Medium',
        description: (ticketData.description || '').trim(),
        photoUris: Array.isArray(ticketData.photoUris) ? ticketData.photoUris : [],
        assignedAgent: null,
        quoteAmount: null,
        paymentStatus: 'PENDING',
        comments: [],
        rating: null,
        feedback: null,
        synced: !this.isOfflineMode(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newTicket, ...tickets];
      await this.saveTickets(updated);
      await this.addNotification(
        this.isOfflineMode()
          ? `[Offline Cache] Ticket #${newTicket.id} saved locally.`
          : `[Alert] New Ticket #${newTicket.id} created.`
      );
      return updated;
    } finally {
      createTicketLock = false;
    }
  },

  async acceptTicket(ticketId, agentUser) {
    const tickets = await this.getTickets();
    let found = false;
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        found = true;
        return {
          ...t,
          status: 'IN_PROGRESS',
          assignedAgent: {
            name: agentUser?.name || 'Agent',
            agentId: agentUser?.agentId || agentUser?.id || 'AGT001',
            email: agentUser?.email || '',
          },
        };
      }
      return t;
    });
    if (!found) throw new Error(`Ticket #${ticketId} not found in local cache.`);
    await this.saveTickets(updated);
    await this.addNotification(`[Alert] Ticket #${ticketId} accepted by ${agentUser?.agentId || 'Agent'}.`);
    return updated;
  },

  async updateTicketStatus(ticketId, newStatus) {
    const tickets = await this.getTickets();
    const target = tickets.find(t => t.id === ticketId);
    if (!target) throw new Error(`Ticket #${ticketId} not found.`);
    if (newStatus === 'CLOSED' && target.paymentStatus !== 'SUCCESS') {
      throw new Error('Cannot close ticket. Payment must be completed first.');
    }
    const updated = tickets.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t));
    await this.saveTickets(updated);
    await this.addNotification(`[Alert] Ticket #${ticketId} status changed to ${newStatus}.`);
    return updated;
  },

  async setQuote(ticketId, amountInINR) {
    const numericAmount = Number(amountInINR);
    if (!numericAmount || numericAmount <= 0) {
      throw new Error('Please enter a valid positive amount in INR.');
    }
    const tickets = await this.getTickets();
    const updated = tickets.map(t =>
      t.id === ticketId ? { ...t, status: 'QUOTE_PENDING', quoteAmount: `${numericAmount}` } : t
    );
    await this.saveTickets(updated);
    await this.addNotification(`[Alert] Quote of ₹${numericAmount} INR set for Ticket #${ticketId}.`);
    return updated;
  },

  async makePayment(ticketId) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t =>
      t.id === ticketId ? { ...t, paymentStatus: 'SUCCESS', status: 'PAID' } : t
    );
    await this.saveTickets(updated);
    await this.addNotification(`[Alert] Payment recorded for Ticket #${ticketId}.`);
    return updated;
  },

  async submitCsatRating(ticketId, ratingScore, feedbackText) {
    const tickets = await this.getTickets();
    const updated = tickets.map(t =>
      t.id === ticketId ? { ...t, rating: ratingScore, feedback: (feedbackText || '').trim() } : t
    );
    await this.saveTickets(updated);
    await this.addNotification(`[CSAT] ${ratingScore}-star rating saved for Ticket #${ticketId}.`);
    return updated;
  },

  async addComment(ticketId, commentText, senderName) {
    const cleanText = (commentText || '').trim();
    if (!cleanText) return this.getTickets();
    const tickets = await this.getTickets();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const comments = Array.isArray(t.comments) ? t.comments : [];
        return {
          ...t,
          comments: [
            ...comments,
            {
              id: `${Date.now()}`,
              sender: senderName || 'User',
              text: cleanText,
              time: new Date().toLocaleTimeString(),
            },
          ],
        };
      }
      return t;
    });
    await this.saveTickets(updated);
    return updated;
  },
};