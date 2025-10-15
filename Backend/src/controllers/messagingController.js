const Joi = require('joi');
const messagingService = require('../services/messagingService');
const socketManager = require('../services/socketManager');
const { logger } = require('../utils/logger');

class MessagingController {
  async listConversations(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const offset = parseInt(req.query.offset, 10) || 0;

      const conversations = await messagingService.listConversations(userId, { limit, offset });

      return res.json({
        success: true,
        data: { conversations }
      });
    } catch (error) {
      logger.error('List conversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        code: 'SERVER_ERROR'
      });
    }
  }

  async createConversation(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const schema = Joi.object({
        participantIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
        title: Joi.string().allow(null, '').optional(),
        conversationType: Joi.string().max(32).default('consumer_vendor'),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const conversation = await messagingService.createConversation({
        creatorId: userId,
        participantIds: value.participantIds,
        title: value.title,
        conversationType: value.conversationType,
        metadata: value.metadata
      });

      const populated = await messagingService.getConversation(conversation.id, userId);

      return res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: { conversation: populated }
      });
    } catch (error) {
      logger.error('Create conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
        code: 'SERVER_ERROR'
      });
    }
  }

  async ensureDirectConversation(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const schema = Joi.object({
        targetUserId: Joi.string().uuid().required(),
        conversationType: Joi.string().max(32).default('consumer_vendor'),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const conversation = await messagingService.ensureDirectConversation(userId, value.targetUserId, {
        creatorId: userId,
        conversationType: value.conversationType,
        metadata: value.metadata
      });

      const populated = await messagingService.getConversation(conversation.id, userId);
      const participantIds = populated?.participants?.map((p) => p.userId) || [];
      socketManager.emitConversationCreated(populated, participantIds);

      return res.json({
        success: true,
        data: { conversation: populated }
      });
    } catch (error) {
      logger.error('Ensure direct conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create or fetch conversation',
        code: 'SERVER_ERROR'
      });
    }
  }

  async getConversation(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { conversationId } = req.params;

      const conversation = await messagingService.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      return res.json({
        success: true,
        data: { conversation }
      });
    } catch (error) {
      logger.error('Get conversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
        code: 'SERVER_ERROR'
      });
    }
  }

  async getMessages(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { conversationId } = req.params;
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const before = req.query.before ? new Date(req.query.before).toISOString() : undefined;

      const messages = await messagingService.getMessages(conversationId, userId, { limit, before });

      return res.json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      logger.error('Get messages error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        code: 'SERVER_ERROR'
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { conversationId } = req.params;
      const schema = Joi.object({
        content: Joi.string().allow(null, '').optional(),
        messageType: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
        metadata: Joi.object().default({}),
        attachments: Joi.array().items(Joi.object()).default([])
      }).custom((value, helpers) => {
        if ((!value.content || value.content.trim().length === 0) && (!value.attachments || value.attachments.length === 0)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'message content validation');

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Message content or attachments are required',
          code: 'VALIDATION_ERROR'
        });
      }

      const message = await messagingService.sendMessage(conversationId, userId, value);

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message }
      });
    } catch (error) {
      logger.error('Send message error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to send message',
        code: error.code || 'SERVER_ERROR'
      });
    }
  }

  async markConversationRead(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { conversationId } = req.params;
      const schema = Joi.object({
        lastMessageId: Joi.string().uuid().optional()
      });

      const { error, value } = schema.validate(req.body || {});
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const participant = await messagingService.markConversationRead(conversationId, userId, value.lastMessageId);

      return res.json({
        success: true,
        message: 'Conversation marked as read',
        data: { participant }
      });
    } catch (error) {
      logger.error('Mark conversation read error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to mark conversation as read',
        code: error.code || 'SERVER_ERROR'
      });
    }
  }

  async typingIndicator(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { conversationId } = req.params;
      const schema = Joi.object({
        isTyping: Joi.boolean().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      await messagingService.assertParticipant(conversationId, userId);
      await messagingService.setTyping(conversationId, userId, value.isTyping);

      return res.json({
        success: true,
        message: 'Typing status updated'
      });
    } catch (error) {
      logger.error('Typing indicator error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update typing status',
        code: error.code || 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new MessagingController();
