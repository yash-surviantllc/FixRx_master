/**
 * Mobile App Specific Routes
 * Additional endpoints required for React Native FixRx app
 */

const express = require('express');
const { Client } = require('pg');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware');

const router = express.Router();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_production',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx123',
};

// =============================================================================
// SERVICE CATEGORIES & SERVICES
// =============================================================================

/**
 * @route GET /api/v1/services/categories
 * @desc Get all service categories
 * @access Public
 */
router.get('/services/categories', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, name, description, icon_url, sort_order
      FROM service_categories 
      WHERE is_active = true 
      ORDER BY sort_order, name
    `);

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });

  } catch (error) {
    console.error('Get service categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch service categories'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route GET /api/v1/services/categories/:categoryId/services
 * @desc Get services by category
 * @access Public
 */
router.get('/services/categories/:categoryId/services', async (req, res) => {
  const client = new Client(dbConfig);
  const { categoryId } = req.params;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT s.id, s.name, s.description, sc.name as category_name
      FROM services s
      JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.category_id = $1 AND s.is_active = true
      ORDER BY s.name
    `, [categoryId]);

    res.json({
      success: true,
      data: {
        services: result.rows
      }
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch services'
      }
    });
  } finally {
    await client.end();
  }
});

// =============================================================================
// CONNECTION REQUESTS
// =============================================================================

/**
 * @route POST /api/v1/connections/request
 * @desc Create a connection request from consumer to vendor
 * @access Private (Consumer)
 */
router.post('/connections/request', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { vendorId, serviceId, message, projectDescription, budgetMin, budgetMax, preferredStartDate, urgency } = req.body;
  
  try {
    await client.connect();
    
    // Check if consumer
    const userResult = await client.query('SELECT user_type FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows[0]?.user_type !== 'CONSUMER') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only consumers can create connection requests' }
      });
    }

    // Create connection request
    const result = await client.query(`
      INSERT INTO connection_requests (
        consumer_id, vendor_id, service_id, message, project_description, 
        budget_range_min, budget_range_max, preferred_start_date, urgency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.id, vendorId, serviceId, message, projectDescription, budgetMin, budgetMax, preferredStartDate, urgency || 'MEDIUM']);

    res.status(201).json({
      success: true,
      message: 'Connection request created successfully',
      data: {
        connectionRequest: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Create connection request error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create connection request'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route GET /api/v1/connections/requests
 * @desc Get user's connection requests
 * @access Private
 */
router.get('/connections/requests', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Get user type
    const userResult = await client.query('SELECT user_type FROM users WHERE id = $1', [req.user.id]);
    const userType = userResult.rows[0]?.user_type;

    let query, params;
    
    if (userType === 'CONSUMER') {
      // Get requests sent by consumer
      query = `
        SELECT cr.*, 
               v.first_name as vendor_first_name, v.last_name as vendor_last_name,
               v.email as vendor_email, v.phone as vendor_phone,
               s.name as service_name, sc.name as category_name
        FROM connection_requests cr
        JOIN users v ON cr.vendor_id = v.id
        LEFT JOIN services s ON cr.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE cr.consumer_id = $1
        ORDER BY cr.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Get requests received by vendor
      query = `
        SELECT cr.*, 
               c.first_name as consumer_first_name, c.last_name as consumer_last_name,
               c.email as consumer_email, c.phone as consumer_phone,
               s.name as service_name, sc.name as category_name
        FROM connection_requests cr
        JOIN users c ON cr.consumer_id = c.id
        LEFT JOIN services s ON cr.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE cr.vendor_id = $1
        ORDER BY cr.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: {
        connectionRequests: result.rows,
        userType
      }
    });

  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch connection requests'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route PUT /api/v1/connections/requests/:requestId/status
 * @desc Update connection request status (accept/decline)
 * @access Private (Vendor)
 */
router.put('/connections/requests/:requestId/status', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { requestId } = req.params;
  const { status } = req.body; // ACCEPTED, DECLINED
  
  try {
    await client.connect();
    
    // Verify vendor owns this request
    const requestResult = await client.query(`
      SELECT * FROM connection_requests 
      WHERE id = $1 AND vendor_id = $2
    `, [requestId, req.user.id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection request not found' }
      });
    }

    // Update status
    const result = await client.query(`
      UPDATE connection_requests 
      SET status = $1, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, requestId]);

    res.json({
      success: true,
      message: `Connection request ${status.toLowerCase()}`,
      data: {
        connectionRequest: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update connection request status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update connection request'
      }
    });
  } finally {
    await client.end();
  }
});

// =============================================================================
// MESSAGES
// =============================================================================

/**
 * @route POST /api/v1/messages/send
 * @desc Send a message between users
 * @access Private
 */
router.post('/messages/send', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { recipientId, content, connectionRequestId, messageType = 'TEXT' } = req.body;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      INSERT INTO messages (sender_id, recipient_id, content, connection_request_id, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, recipientId, content, connectionRequestId, messageType]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to send message'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route GET /api/v1/messages/conversations
 * @desc Get user's conversations
 * @access Private
 */
router.get('/messages/conversations', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT DISTINCT 
        CASE 
          WHEN m.sender_id = $1 THEN m.recipient_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.first_name, u.last_name, u.email, u.profile_image_url,
        (SELECT content FROM messages m2 
         WHERE (m2.sender_id = $1 AND m2.recipient_id = other_user_id) 
            OR (m2.recipient_id = $1 AND m2.sender_id = other_user_id)
         ORDER BY m2.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m2 
         WHERE (m2.sender_id = $1 AND m2.recipient_id = other_user_id) 
            OR (m2.recipient_id = $1 AND m2.sender_id = other_user_id)
         ORDER BY m2.created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.recipient_id = $1 AND m2.sender_id = other_user_id AND m2.is_read = false) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.recipient_id = $1
      ORDER BY last_message_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        conversations: result.rows
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch conversations'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route GET /api/v1/messages/conversation/:userId
 * @desc Get messages in a conversation with specific user
 * @access Private
 */
router.get('/messages/conversation/:userId', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT m.*, 
             s.first_name as sender_first_name, s.last_name as sender_last_name,
             r.first_name as recipient_first_name, r.last_name as recipient_last_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.recipient_id = r.id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2) 
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `, [req.user.id, userId, limit, offset]);

    // Mark messages as read
    await client.query(`
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false
    `, [req.user.id, userId]);

    res.json({
      success: true,
      data: {
        messages: result.rows.reverse() // Reverse to show oldest first
      }
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch conversation messages'
      }
    });
  } finally {
    await client.end();
  }
});

// =============================================================================
// RATINGS & REVIEWS
// =============================================================================

/**
 * @route POST /api/v1/ratings/create
 * @desc Create a rating/review
 * @access Private
 */
router.post('/ratings/create', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { 
    ratedUserId, 
    connectionRequestId, 
    overallRating, 
    costRating, 
    qualityRating, 
    timelinessRating, 
    professionalismRating, 
    reviewText 
  } = req.body;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      INSERT INTO ratings (
        rater_id, rated_id, connection_request_id, overall_rating,
        cost_rating, quality_rating, timeliness_rating, professionalism_rating, review_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id, ratedUserId, connectionRequestId, overallRating,
      costRating, qualityRating, timelinessRating, professionalismRating, reviewText
    ]);

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: {
        rating: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create rating'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route GET /api/v1/ratings/user/:userId
 * @desc Get ratings for a user
 * @access Public
 */
router.get('/ratings/user/:userId', async (req, res) => {
  const client = new Client(dbConfig);
  const { userId } = req.params;
  
  try {
    await client.connect();
    
    const ratingsResult = await client.query(`
      SELECT r.*, 
             rater.first_name as rater_first_name, rater.last_name as rater_last_name
      FROM ratings r
      JOIN users rater ON r.rater_id = rater.id
      WHERE r.rated_id = $1 AND r.is_public = true
      ORDER BY r.created_at DESC
    `, [userId]);

    const avgResult = await client.query(`
      SELECT 
        AVG(overall_rating) as avg_overall,
        AVG(cost_rating) as avg_cost,
        AVG(quality_rating) as avg_quality,
        AVG(timeliness_rating) as avg_timeliness,
        AVG(professionalism_rating) as avg_professionalism,
        COUNT(*) as total_ratings
      FROM ratings 
      WHERE rated_id = $1 AND is_public = true
    `, [userId]);

    res.json({
      success: true,
      data: {
        ratings: ratingsResult.rows,
        averages: avgResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch ratings'
      }
    });
  } finally {
    await client.end();
  }
});

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * @route GET /api/v1/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { limit = 20, offset = 0 } = req.query;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const unreadCount = await client.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: parseInt(unreadCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch notifications'
      }
    });
  } finally {
    await client.end();
  }
});

/**
 * @route PUT /api/v1/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  const client = new Client(dbConfig);
  const { notificationId } = req.params;
  
  try {
    await client.connect();
    
    const result = await client.query(`
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update notification'
      }
    });
  } finally {
    await client.end();
  }
});

module.exports = router;
