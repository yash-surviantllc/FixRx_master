const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

class SocketManager {
  constructor() {
    this.io = null;
    this.initialized = false;
  }

  initialize(httpServer) {
    if (this.initialized || !httpServer) {
      return this.io;
    }

    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          return next(new Error('AUTH_REQUIRED'));
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret);

        const userId = decoded.userId || decoded.id;
        if (!userId) {
          return next(new Error('INVALID_TOKEN'));
        }

        socket.data = socket.data || {};
        socket.data.userId = userId;
        socket.join(`user:${userId}`);

        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error.message);
        next(new Error('AUTH_FAILED'));
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`🟢 WebSocket connected: ${socket.id} (user: ${socket.data.userId})`);

      socket.on('join:conversation', ({ conversationId }) => {
        if (conversationId) {
          socket.join(`conversation:${conversationId}`);
        }
      });

      socket.on('leave:conversation', ({ conversationId }) => {
        if (conversationId) {
          socket.leave(`conversation:${conversationId}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`🔴 WebSocket disconnected: ${socket.id}`);
      });
    });

    this.initialized = true;
    logger.info('✅ Socket.IO initialized');
    return this.io;
  }

  emitConversationCreated(conversation, participantIds = []) {
    if (!this.io || !conversation) return;
    const uniqueParticipants = Array.from(new Set(participantIds)).filter(Boolean);
    uniqueParticipants.forEach((userId) => {
      this.io.to(`user:${userId}`).emit('conversation:created', conversation);
    });
  }

  emitMessage(conversationId, message) {
    if (!this.io || !conversationId || !message) return;
    this.io.to(`conversation:${conversationId}`).emit('message:new', message);
  }

  emitReadReceipt(conversationId, payload) {
    if (!this.io || !conversationId || !payload) return;
    this.io.to(`conversation:${conversationId}`).emit('conversation:read', payload);
  }

  emitTyping(conversationId, payload) {
    if (!this.io || !conversationId || !payload) return;
    this.io.to(`conversation:${conversationId}`).emit('conversation:typing', payload);
  }

  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.initialized = false;
    }
  }
}

module.exports = new SocketManager();
