const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * ConversationService - Manages conversation persistence and retrieval
 * Handles conversation creation, message storage, and history management
 */
class ConversationService {
  /**
   * Create a new conversation
   * @param {string} userId - User ID
   * @param {Object} metadata - Conversation metadata (language, etc.)
   * @returns {Object} Created conversation
   */
  async createConversation(userId, metadata = {}) {
    try {
      const { language = 'hi', title = null } = metadata;

      const result = await query(
        `INSERT INTO conversations (user_id, language, title, metadata)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, language, title, JSON.stringify(metadata)]
      );

      const conversation = result.rows[0];
      logger.info(`Conversation created: ${conversation.id} for user: ${userId}`);

      return {
        success: true,
        conversation
      };
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} role - Message role (user, assistant, system)
   * @param {string} content - Message content
   * @param {Object} metadata - Message metadata
   * @returns {Object} Created message
   */
  async addMessage(conversationId, role, content, metadata = {}) {
    try {
      const { contentType = 'text', voiceDuration = null } = metadata;

      // Insert message
      const messageResult = await query(
        `INSERT INTO conversation_messages 
         (conversation_id, role, content, content_type, voice_duration, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          conversationId,
          role,
          content,
          contentType,
          voiceDuration,
          JSON.stringify(metadata)
        ]
      );

      const message = messageResult.rows[0];

      // Update conversation metadata
      await this._updateConversationTimestamp(conversationId);
      await this._incrementMessageCount(conversationId);

      // Auto-generate title from first user message if not set
      if (role === 'user') {
        await this._autoGenerateTitle(conversationId, content);
      }

      logger.info(`Message added: ${message.id} to conversation: ${conversationId}`);

      return {
        success: true,
        message
      };
    } catch (error) {
      logger.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user with pagination
   * @param {string} userId - User ID
   * @param {number} limit - Number of conversations to retrieve
   * @param {number} offset - Offset for pagination
   * @param {Object} filters - Optional filters (status, dateRange)
   * @returns {Object} Conversations list
   */
  async getConversationHistory(userId, limit = 20, offset = 0, filters = {}) {
    try {
      const { status = 'active', startDate = null, endDate = null } = filters;

      let queryText = `
        SELECT c.*,
               (SELECT content FROM conversation_messages 
                WHERE conversation_id = c.id 
                ORDER BY created_at DESC LIMIT 1) as last_message_preview
        FROM conversations c
        WHERE c.user_id = $1 AND c.status = $2
      `;

      const params = [userId, status];
      let paramIndex = 3;

      if (startDate) {
        queryText += ` AND c.last_message_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryText += ` AND c.last_message_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      queryText += ` ORDER BY c.last_message_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM conversations WHERE user_id = $1 AND status = $2`,
        [userId, status]
      );

      const total = parseInt(countResult.rows[0].total);

      logger.info(`Retrieved ${result.rows.length} conversations for user: ${userId}`);

      return {
        success: true,
        conversations: result.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with all messages
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Conversation with messages
   */
  async getConversation(conversationId, userId = null) {
    try {
      // Get conversation
      let conversationQuery = `SELECT * FROM conversations WHERE id = $1`;
      const conversationParams = [conversationId];

      if (userId) {
        conversationQuery += ` AND user_id = $2`;
        conversationParams.push(userId);
      }

      const conversationResult = await query(conversationQuery, conversationParams);

      if (conversationResult.rows.length === 0) {
        return {
          success: false,
          error: 'Conversation not found or access denied'
        };
      }

      const conversation = conversationResult.rows[0];

      // Get all messages
      const messagesResult = await query(
        `SELECT cm.*, rd.severity_level, rd.recommended_facility, rd.reasoning
         FROM conversation_messages cm
         LEFT JOIN routing_decisions rd ON cm.id = rd.message_id
         WHERE cm.conversation_id = $1
         ORDER BY cm.created_at ASC`,
        [conversationId]
      );

      conversation.messages = messagesResult.rows;

      logger.info(`Retrieved conversation: ${conversationId} with ${messagesResult.rows.length} messages`);

      return {
        success: true,
        conversation
      };
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation metadata
   * @param {string} conversationId - Conversation ID
   * @param {Object} updates - Metadata updates
   * @returns {Object} Updated conversation
   */
  async updateConversationMetadata(conversationId, updates) {
    try {
      const { language, status, title, metadata } = updates;

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (language) {
        updateFields.push(`language = $${paramIndex}`);
        params.push(language);
        paramIndex++;
      }

      if (status) {
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (title) {
        updateFields.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }

      if (metadata) {
        updateFields.push(`metadata = $${paramIndex}`);
        params.push(JSON.stringify(metadata));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      params.push(conversationId);

      const result = await query(
        `UPDATE conversations 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Conversation not found' };
      }

      logger.info(`Updated conversation metadata: ${conversationId}`);

      return {
        success: true,
        conversation: result.rows[0]
      };
    } catch (error) {
      logger.error('Error updating conversation metadata:', error);
      throw error;
    }
  }

  /**
   * Update conversation last_message_at timestamp
   * @private
   */
  async _updateConversationTimestamp(conversationId) {
    try {
      await query(
        `UPDATE conversations 
         SET last_message_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [conversationId]
      );
    } catch (error) {
      logger.error('Error updating conversation timestamp:', error);
    }
  }

  /**
   * Increment message count for conversation
   * @private
   */
  async _incrementMessageCount(conversationId) {
    try {
      await query(
        `UPDATE conversations 
         SET message_count = message_count + 1
         WHERE id = $1`,
        [conversationId]
      );
    } catch (error) {
      logger.error('Error incrementing message count:', error);
    }
  }

  /**
   * Auto-generate conversation title from first message
   * @private
   */
  async _autoGenerateTitle(conversationId, content) {
    try {
      // Check if title already exists
      const checkResult = await query(
        `SELECT title FROM conversations WHERE id = $1`,
        [conversationId]
      );

      if (checkResult.rows[0].title) {
        return; // Title already set
      }

      // Generate title from first 50 characters of content
      const title = content.length > 50 
        ? content.substring(0, 50) + '...' 
        : content;

      await query(
        `UPDATE conversations 
         SET title = $1
         WHERE id = $2`,
        [title, conversationId]
      );

      logger.info(`Auto-generated title for conversation: ${conversationId}`);
    } catch (error) {
      logger.error('Error auto-generating title:', error);
    }
  }
}

module.exports = ConversationService;
