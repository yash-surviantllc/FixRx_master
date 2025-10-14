const socketManager = require('./socketManager');
const { dbManager } = require('../config/database');

class MessagingService {
  async createConversation({ creatorId, participantIds = [], title = null, conversationType = 'consumer_vendor', metadata = {} }) {
    if (!participantIds || participantIds.length === 0) {
      throw new Error('At least one participant is required');
    }

    const pool = await dbManager.getConnection();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const conversationInsert = `
        INSERT INTO conversations (title, conversation_type, created_by, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const conversationResult = await client.query(conversationInsert, [
        title,
        conversationType,
        creatorId || null,
        metadata,
      ]);

      const conversation = conversationResult.rows[0];

      const participants = Array.from(new Set([...participantIds, creatorId])).filter(Boolean);
      const participantInsert = `
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES ($1, $2, COALESCE($3::conversation_role_enum, 'consumer'))
        ON CONFLICT (conversation_id, user_id) DO NOTHING
      `;

      for (const participantId of participants) {
        const role = participantId === creatorId ? 'consumer' : undefined;
        await client.query(participantInsert, [conversation.id, participantId, role]);
      }

      await client.query('COMMIT');
      socketManager.emitConversationCreated(conversation, participantIds.filter((id) => id !== creatorId));
      return conversation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureDirectConversation(userAId, userBId, options = {}) {
    const conversationType = options.conversationType || 'consumer_vendor';

    const existingQuery = `
      SELECT c.*
      FROM conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2
      WHERE c.conversation_type = $3
        AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) = 2
      LIMIT 1
    `;

    const existing = await dbManager.query(existingQuery, [userAId, userBId, conversationType]);
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const conversation = await this.createConversation({
      creatorId: options.creatorId || userAId,
      participantIds: [userAId, userBId],
      conversationType,
      metadata: options.metadata || {},
    });
    socketManager.emitConversationCreated(conversation, [userBId]);
    return conversation;
  }

  async listConversations(userId, { limit = 20, offset = 0 } = {}) {
    const query = `
      SELECT c.id,
             c.title,
             c.conversation_type,
             c.created_at,
             c.updated_at,
             c.metadata,
             json_agg(
               json_build_object(
                 'userId', cp_other.user_id,
                 'role', cp_other.role,
                 'joinedAt', cp_other.joined_at,
                 'isMuted', cp_other.is_muted,
                 'firstName', u_other.first_name,
                 'lastName', u_other.last_name,
                 'email', u_other.email,
                 'avatarUrl', COALESCE(u_other.profile_image_url, u_other.profile_image, '')
               )
             ) FILTER (WHERE cp_other.user_id IS NOT NULL AND cp_other.user_id != $1) AS participants,
             json_build_object(
               'id', last_msg.id,
               'content', last_msg.content,
               'messageType', last_msg.message_type,
               'senderId', last_msg.sender_id,
               'createdAt', last_msg.created_at,
               'sender', json_build_object(
                 'firstName', last_msg_user.first_name,
                 'lastName', last_msg_user.last_name,
                 'avatarUrl', COALESCE(last_msg_user.profile_image_url, last_msg_user.profile_image, '')
               )
             ) AS last_message,
             COALESCE(unread_count.count, 0) AS unread_count
      FROM conversations c
      JOIN conversation_participants cp_self ON cp_self.conversation_id = c.id AND cp_self.user_id = $1
      LEFT JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id
      LEFT JOIN users u_other ON u_other.id = cp_other.user_id
      LEFT JOIN LATERAL (
        SELECT m.*
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_msg ON true
      LEFT JOIN users last_msg_user ON last_msg_user.id = last_msg.sender_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)
        FROM messages m2
        WHERE m2.conversation_id = c.id
          AND m2.created_at > COALESCE(cp_self.last_read_at, '1970-01-01')
      ) AS unread_count(count) ON true
      GROUP BY c.id, last_msg.id, unread_count.count
      ORDER BY COALESCE(last_msg.created_at, c.updated_at) DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await dbManager.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getConversation(conversationId, userId) {
    const query = `
      SELECT c.id,
             c.title,
             c.conversation_type,
             c.metadata,
             c.created_at,
             c.updated_at,
             json_agg(
               json_build_object(
                 'userId', cp.user_id,
                 'role', cp.role,
                 'joinedAt', cp.joined_at,
                 'isMuted', cp.is_muted,
                 'lastReadMessageId', cp.last_read_message_id,
                 'lastReadAt', cp.last_read_at,
                 'firstName', u.first_name,
                 'lastName', u.last_name,
                 'email', u.email,
                 'avatarUrl', COALESCE(u.profile_image_url, u.profile_image, '')
               )
             ) FILTER (WHERE cp.user_id IS NOT NULL) AS participants
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      LEFT JOIN users u ON u.id = cp.user_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await dbManager.query(query, [conversationId]);
    if (result.rows.length === 0) {
      return null;
    }

    const conversation = result.rows[0];
    const isParticipant = conversation.participants.some((participant) => participant.userId === userId);
    if (!isParticipant) {
      return null;
    }

    return conversation;
  }

  async getMessages(conversationId, userId, { limit = 50, before } = {}) {
    await this.assertParticipant(conversationId, userId);

    const params = [conversationId];
    let whereClause = 'conversation_id = $1';

    if (before) {
      params.push(before);
      whereClause += ` AND created_at < $${params.length}`;
    }

    params.push(limit);

    const query = `
      SELECT m.id,
             m.conversation_id,
             m.sender_id,
             m.message_type,
             m.content,
             m.metadata,
             m.attachments,
             m.created_at,
             m.updated_at,
             m.deleted_at,
             json_build_object(
               'firstName', u.first_name,
               'lastName', u.last_name,
               'avatarUrl', COALESCE(u.profile_image_url, u.profile_image, '')
             ) AS sender
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${params.length}
    `;

    const result = await dbManager.query(query, params);
    return result.rows;
  }

  async sendMessage(conversationId, senderId, { content, messageType = 'text', metadata = {}, attachments = [] }) {
    await this.assertParticipant(conversationId, senderId);

    if (!content && (!attachments || attachments.length === 0)) {
      throw new Error('Message content or attachments required');
    }

    const insertQuery = `
      INSERT INTO messages (conversation_id, sender_id, message_type, content, metadata, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await dbManager.query(insertQuery, [
      conversationId,
      senderId,
      messageType,
      content || null,
      metadata,
      attachments,
    ]);

    const message = result.rows[0];
    socketManager.emitMessage(conversationId, message);

    await dbManager.query(
      `UPDATE conversation_participants
       SET last_read_message_id = $3,
           last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, senderId, message.id]
    );

    await dbManager.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);

    return message;
  }

  async markConversationRead(conversationId, userId, lastMessageId = null) {
    await this.assertParticipant(conversationId, userId);

    const updateQuery = `
      UPDATE conversation_participants
      SET last_read_message_id = COALESCE($3, last_read_message_id),
          last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await dbManager.query(updateQuery, [conversationId, userId, lastMessageId]);
    const participant = result.rows[0];
    socketManager.emitReadReceipt(conversationId, {
      userId,
      lastMessageId: lastMessageId || participant?.last_read_message_id,
      readAt: participant?.last_read_at
    });
    return participant;
  }

  async saveReadReceipt(messageId, userId) {
    const insertQuery = `
      INSERT INTO message_reads (message_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW()
      RETURNING *
    `;

    const result = await dbManager.query(insertQuery, [messageId, userId]);
    return result.rows[0];
  }

  async setTyping(conversationId, userId, isTyping) {
    await this.assertParticipant(conversationId, userId);
    socketManager.emitTyping(conversationId, {
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  async assertParticipant(conversationId, userId) {
    const check = await dbManager.query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
      [conversationId, userId]
    );

    if (check.rows.length === 0) {
      const error = new Error('User is not a participant in this conversation');
      error.statusCode = 403;
      throw error;
    }
  }
}

module.exports = new MessagingService();
