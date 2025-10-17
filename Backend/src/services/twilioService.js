/**
 * Enhanced Twilio SMS Service for FixRx
 * Handles SMS operations with A2P 10DLC compliance and bulk processing
 */

const twilio = require('twilio');
const { dbManager } = require('../config/database');

class TwilioService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.rateLimitQueue = [];
    this.isProcessingQueue = false;
    
    this.initialize();
  }

  /**
   * Send plain verification code message
   */
  async sendVerificationCode({ to, code, purpose = 'LOGIN' }) {
    if (!this.isAvailable()) {
      console.warn('Twilio not available. Verification code cannot be delivered via SMS.');
      return {
        success: false,
        message: 'Twilio not configured'
      };
    }

    const body = `Your FixRx verification code is ${code}. It will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;

    const result = await this.sendSMS({
      to,
      body,
      priority: 'high',
      userId: null,
      templateId: null
    });

    return {
      success: true,
      data: result
    };
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (accountSid && authToken) {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('✅ Twilio SMS service initialized successfully');
        
        // Start processing queue
        this.startQueueProcessor();
      } else {
        console.warn('⚠️ Twilio credentials not found - SMS service disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Twilio service:', error);
    }
  }

  /**
   * Check if Twilio is configured
   */
  isAvailable() {
    return this.isConfigured && this.client;
  }

  /**
   * Send single SMS with delivery tracking
   */
  async sendSMS(options) {
    if (!this.isAvailable()) {
      throw new Error('Twilio SMS service is not configured');
    }

    const {
      to,
      body,
      from = process.env.TWILIO_PHONE_NUMBER,
      userId = null,
      templateId = null,
      variables = {},
      priority = 'normal'
    } = options;

    // Validate phone number
    if (!this.validatePhoneNumber(to)) {
      throw new Error('Invalid phone number format');
    }

    // Process template if provided
    let messageBody = body;
    if (templateId) {
      messageBody = await this.processTemplate(templateId, variables);
    }

    try {
      // Create SMS record in database
      const smsRecord = await this.createSMSRecord({
        userId,
        to,
        body: messageBody,
        from,
        templateId,
        priority,
        status: 'queued'
      });

      // Add to rate limit queue or send immediately
      if (priority === 'high') {
        return await this.sendImmediately(smsRecord, { to, body: messageBody, from });
      } else {
        return await this.addToQueue(smsRecord, { to, body: messageBody, from });
      }
    } catch (error) {
      console.error('SMS send error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS immediately (for high priority)
   */
  async sendImmediately(smsRecord, messageOptions) {
    try {
      const message = await this.client.messages.create(messageOptions);
      
      // Update record with Twilio SID and status
      await this.updateSMSRecord(smsRecord.id, {
        twilio_sid: message.sid,
        status: message.status,
        sent_at: new Date(),
        cost: this.calculateCost(messageOptions.body),
        segments: this.calculateSegments(messageOptions.body)
      });

      return {
        id: smsRecord.id,
        twilioSid: message.sid,
        status: message.status,
        to: messageOptions.to,
        cost: this.calculateCost(messageOptions.body)
      };
    } catch (error) {
      // Update record with error
      await this.updateSMSRecord(smsRecord.id, {
        status: 'failed',
        error_message: error.message,
        failed_at: new Date()
      });
      throw error;
    }
  }

  /**
   * Add SMS to rate-limited queue
   */
  async addToQueue(smsRecord, messageOptions) {
    this.rateLimitQueue.push({
      smsRecord,
      messageOptions,
      timestamp: Date.now()
    });

    return {
      id: smsRecord.id,
      status: 'queued',
      queuePosition: this.rateLimitQueue.length
    };
  }

  /**
   * Process SMS queue with rate limiting (1 MPS default)
   */
  startQueueProcessor() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    const rateLimit = parseInt(process.env.TWILIO_RATE_LIMIT_MPS) || 1; // Messages per second
    const interval = 1000 / rateLimit; // Milliseconds between messages

    setInterval(async () => {
      if (this.rateLimitQueue.length === 0) return;

      const queueItem = this.rateLimitQueue.shift();
      
      try {
        await this.sendImmediately(queueItem.smsRecord, queueItem.messageOptions);
      } catch (error) {
        console.error('Queue processing error:', error);
      }
    }, interval);
  }

  /**
   * Bulk SMS with rate limiting compliance
   */
  async sendBulkSMS(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and must not be empty');
    }

    const {
      userId = null,
      templateId = null,
      priority = 'normal',
      batchName = null
    } = options;

    // Create bulk batch record
    const batchId = await this.createBulkBatch({
      userId,
      batchName: batchName || `Bulk SMS ${new Date().toISOString()}`,
      totalMessages: messages.length,
      templateId,
      priority
    });

    const results = {
      batchId,
      successful: [],
      failed: [],
      queued: []
    };

    // Process each message
    for (const message of messages) {
      try {
        const result = await this.sendSMS({
          ...message,
          userId,
          templateId,
          priority,
          batchId
        });

        if (result.status === 'queued') {
          results.queued.push(result);
        } else {
          results.successful.push(result);
        }
      } catch (error) {
        results.failed.push({
          to: message.to,
          error: error.message
        });
      }
    }

    // Update batch record
    await this.updateBulkBatch(batchId, {
      processed_messages: messages.length,
      successful_messages: results.successful.length,
      failed_messages: results.failed.length,
      queued_messages: results.queued.length,
      status: 'completed',
      completed_at: new Date()
    });

    return results;
  }

  /**
   * Get SMS delivery status
   */
  async getSMSStatus(smsId) {
    try {
      // Get from database first
      const smsRecord = await this.getSMSRecord(smsId);
      
      if (!smsRecord) {
        throw new Error('SMS record not found');
      }

      // If we have a Twilio SID, fetch latest status
      if (smsRecord.twilio_sid && this.isAvailable()) {
        try {
          const message = await this.client.messages(smsRecord.twilio_sid).fetch();
          
          // Update our record if status changed
          if (message.status !== smsRecord.status) {
            await this.updateSMSRecord(smsId, {
              status: message.status,
              delivered_at: message.status === 'delivered' ? new Date() : null,
              error_message: message.errorMessage || null
            });
            
            smsRecord.status = message.status;
            smsRecord.delivered_at = message.status === 'delivered' ? new Date() : null;
          }
        } catch (twilioError) {
          console.warn('Failed to fetch status from Twilio:', twilioError.message);
        }
      }

      return {
        id: smsRecord.id,
        status: smsRecord.status,
        to: smsRecord.to,
        body: smsRecord.body,
        cost: smsRecord.cost,
        segments: smsRecord.segments,
        sentAt: smsRecord.sent_at,
        deliveredAt: smsRecord.delivered_at,
        errorMessage: smsRecord.error_message,
        twilioSid: smsRecord.twilio_sid
      };
    } catch (error) {
      console.error('Get SMS status error:', error);
      throw error;
    }
  }

  /**
   * Phone number validation and formatting
   */
  validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it's a valid international format
    const internationalRegex = /^\+[1-9]\d{1,14}$/;
    
    return internationalRegex.test(cleaned);
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      // Assume US number if no country code
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Calculate SMS cost (approximate)
   */
  calculateCost(body) {
    const segments = this.calculateSegments(body);
    const costPerSegment = parseFloat(process.env.TWILIO_COST_PER_SEGMENT) || 0.0075;
    return segments * costPerSegment;
  }

  /**
   * Calculate SMS segments
   */
  calculateSegments(body) {
    // GSM 7-bit encoding: 160 characters per segment
    // Unicode (UCS-2): 70 characters per segment
    const hasUnicode = /[^\x00-\x7F]/.test(body);
    const maxLength = hasUnicode ? 70 : 160;
    
    return Math.ceil(body.length / maxLength);
  }

  /**
   * Process SMS template with variables
   */
  async processTemplate(templateId, variables = {}) {
    // This would integrate with your template system
    // For now, return a simple placeholder
    return `Template ${templateId} processed with variables: ${JSON.stringify(variables)}`;
  }

  /**
   * Database operations
   */
  async createSMSRecord(data) {
    const query = `
      INSERT INTO sms_messages (
        user_id, to_number, body, from_number, template_id, 
        priority, status, cost, segments, batch_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.userId,
      data.to,
      data.body,
      data.from,
      data.templateId,
      data.priority,
      data.status,
      this.calculateCost(data.body),
      this.calculateSegments(data.body),
      data.batchId || null
    ];

    const result = await dbManager.query(query, values);
    return result.rows[0];
  }

  async updateSMSRecord(smsId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    });

    if (fields.length === 0) return;

    const query = `
      UPDATE sms_messages 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
    `;
    
    values.push(smsId);
    await dbManager.query(query, values);
  }

  async getSMSRecord(smsId) {
    const query = 'SELECT * FROM sms_messages WHERE id = $1';
    const result = await dbManager.query(query, [smsId]);
    return result.rows[0];
  }

  async createBulkBatch(data) {
    const query = `
      INSERT INTO sms_bulk_batches (
        user_id, batch_name, total_messages, template_id, priority, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      data.userId,
      data.batchName,
      data.totalMessages,
      data.templateId,
      data.priority,
      'processing'
    ];

    const result = await dbManager.query(query, values);
    return result.rows[0].id;
  }

  async updateBulkBatch(batchId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    });

    if (fields.length === 0) return;

    const query = `
      UPDATE sms_bulk_batches 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    values.push(batchId);
    await dbManager.query(query, values);
  }

  /**
   * Get SMS analytics
   */
  async getSMSAnalytics(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date()
    } = options;

    const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued,
        SUM(cost) as total_cost,
        SUM(segments) as total_segments,
        AVG(cost) as avg_cost_per_message
      FROM sms_messages 
      WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;

    const result = await dbManager.query(query, [userId, startDate, endDate]);
    const stats = result.rows[0];

    return {
      totalMessages: parseInt(stats.total_messages),
      delivered: parseInt(stats.delivered),
      failed: parseInt(stats.failed),
      queued: parseInt(stats.queued),
      deliveryRate: stats.total_messages > 0 ? (stats.delivered / stats.total_messages * 100).toFixed(2) : 0,
      totalCost: parseFloat(stats.total_cost || 0),
      totalSegments: parseInt(stats.total_segments || 0),
      avgCostPerMessage: parseFloat(stats.avg_cost_per_message || 0)
    };
  }

  /**
   * Setup database tables
   */
  static async setupTables() {
    const smsMessagesTable = `
      CREATE TABLE IF NOT EXISTS sms_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        to_number VARCHAR(20) NOT NULL,
        body TEXT NOT NULL,
        from_number VARCHAR(20),
        template_id UUID,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(50) DEFAULT 'queued',
        twilio_sid VARCHAR(100),
        cost DECIMAL(10,4) DEFAULT 0,
        segments INTEGER DEFAULT 1,
        batch_id UUID,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sms_user_id ON sms_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_messages(status);
      CREATE INDEX IF NOT EXISTS idx_sms_twilio_sid ON sms_messages(twilio_sid);
      CREATE INDEX IF NOT EXISTS idx_sms_batch_id ON sms_messages(batch_id);
    `;

    const bulkBatchesTable = `
      CREATE TABLE IF NOT EXISTS sms_bulk_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        batch_name VARCHAR(255),
        total_messages INTEGER DEFAULT 0,
        processed_messages INTEGER DEFAULT 0,
        successful_messages INTEGER DEFAULT 0,
        failed_messages INTEGER DEFAULT 0,
        queued_messages INTEGER DEFAULT 0,
        template_id UUID,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sms_batches_user_id ON sms_bulk_batches(user_id);
      CREATE INDEX IF NOT EXISTS idx_sms_batches_status ON sms_bulk_batches(status);
    `;

    await dbManager.query(smsMessagesTable);
    await dbManager.query(bulkBatchesTable);
  }
}

// Create singleton instance
const twilioService = new TwilioService();

module.exports = twilioService;
