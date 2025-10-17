/**
 * Queue Manager - Bull Queue for SMS/Email Processing
 * Architecture: Redis-backed job queue with retry mechanisms
 */

const Queue = require('bull');
const { dbManager } = require('../config/database');

class QueueManager {
  constructor() {
    this.queues = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // SMS Processing Queue
      this.queues.sms = new Queue('SMS Processing', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || null
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000          // Start with 2 second delay
          }
        }
      });

      // Email Processing Queue
      this.queues.email = new Queue('Email Processing', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || null
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      // Push Notification Queue
      this.queues.push = new Queue('Push Notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || null
        },
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000
          }
        }
      });

      // License Verification Queue
      this.queues.verification = new Queue('License Verification', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || null
        },
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 10000
          }
        }
      });

      // Setup job processors
      this.setupProcessors();
      
      // Setup monitoring
      this.setupMonitoring();

      this.isInitialized = true;
      console.log('✅ Queue Manager Initialized:', Object.keys(this.queues));

      return {
        initialized: true,
        queues: Object.keys(this.queues),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Queue Manager Initialization Failed:', error);
      throw error;
    }
  }

  setupProcessors() {
    // SMS Processing
    this.queues.sms.process('send-sms', 10, async (job) => {
      const { phoneNumber, message, templateId, variables } = job.data;
      
      try {
        // Rate limiting check (Twilio: 1 MPS default)
        await this.rateLimitCheck('sms', phoneNumber);
        
        // Process template if provided
        let processedMessage = message;
        if (templateId && variables) {
          processedMessage = await this.processTemplate('sms', templateId, variables);
        }

        // Send SMS via Twilio (mock implementation)
        const result = await this.sendSMS(phoneNumber, processedMessage);
        
        // Update job progress
        job.progress(100);
        
        // Log success
        await this.logCommunication('sms', {
          phoneNumber,
          message: processedMessage,
          status: 'sent',
          messageId: result.messageId,
          cost: result.cost
        });

        return result;

      } catch (error) {
        console.error('❌ SMS Processing Failed:', error);
        throw error;
      }
    });

    // Email Processing
    this.queues.email.process('send-email', 5, async (job) => {
      const { to, subject, content, templateId, variables, attachments } = job.data;
      
      try {
        // Process template if provided
        let processedContent = content;
        let processedSubject = subject;
        
        if (templateId && variables) {
          const template = await this.processTemplate('email', templateId, variables);
          processedContent = template.content;
          processedSubject = template.subject;
        }

        // Send email via SendGrid (mock implementation)
        const result = await this.sendEmail({
          to,
          subject: processedSubject,
          content: processedContent,
          attachments
        });
        
        job.progress(100);
        
        // Log success
        await this.logCommunication('email', {
          to,
          subject: processedSubject,
          status: 'sent',
          messageId: result.messageId
        });

        return result;

      } catch (error) {
        console.error('❌ Email Processing Failed:', error);
        throw error;
      }
    });

    // Push Notification Processing
    this.queues.push.process('send-push', 20, async (job) => {
      const { userId, title, body, data, topic } = job.data;
      
      try {
        // Store notification in PostgreSQL database (Firebase removed)
        const result = await this.sendPushNotification({
          userId,
          title,
          body,
          data,
          topic
        });
        
        job.progress(100);
        
        return result;

      } catch (error) {
        console.error('❌ Push Notification Failed:', error);
        throw error;
      }
    });

    // License Verification Processing
    this.queues.verification.process('verify-license', 3, async (job) => {
      const { vendorId, licenseNumber, licenseType, state } = job.data;
      
      try {
        // Check cache first
        const cacheKey = `license:${licenseNumber}:${state}`;
        let verification = await dbManager.getCache(cacheKey);
        
        if (!verification) {
          // Verify via Verdata/Mesh API (mock implementation)
          verification = await this.verifyLicense({
            licenseNumber,
            licenseType,
            state
          });
          
          // Cache for 24 hours
          await dbManager.setCache(cacheKey, verification, 86400);
        }
        
        // Update vendor record
        await this.updateVendorVerification(vendorId, verification);
        
        job.progress(100);
        
        return verification;

      } catch (error) {
        console.error('❌ License Verification Failed:', error);
        throw error;
      }
    });
  }

  setupMonitoring() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      queue.on('completed', (job, result) => {
        console.log(`✅ ${queueName} Job Completed:`, {
          jobId: job.id,
          type: job.name,
          duration: Date.now() - job.timestamp,
          result: result?.messageId || 'success'
        });
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ ${queueName} Job Failed:`, {
          jobId: job.id,
          type: job.name,
          error: err.message,
          attempts: job.attemptsMade,
          data: job.data
        });
      });

      queue.on('stalled', (job) => {
        console.warn(`⚠️ ${queueName} Job Stalled:`, {
          jobId: job.id,
          type: job.name
        });
      });
    });

    // Periodic queue statistics
    setInterval(async () => {
      for (const [queueName, queue] of Object.entries(this.queues)) {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();

        console.log(`📊 Queue Stats [${queueName}]:`, {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        });
      }
    }, 300000); // Every 5 minutes
  }

  // Queue Management Methods
  async addSMSJob(phoneNumber, message, options = {}) {
    return await this.queues.sms.add('send-sms', {
      phoneNumber,
      message,
      templateId: options.templateId,
      variables: options.variables,
      priority: options.priority || 'normal'
    }, {
      priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 10 : 5,
      delay: options.delay || 0
    });
  }

  async addEmailJob(to, subject, content, options = {}) {
    return await this.queues.email.add('send-email', {
      to,
      subject,
      content,
      templateId: options.templateId,
      variables: options.variables,
      attachments: options.attachments || []
    }, {
      priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 10 : 5,
      delay: options.delay || 0
    });
  }

  async addPushJob(userId, title, body, options = {}) {
    return await this.queues.push.add('send-push', {
      userId,
      title,
      body,
      data: options.data || {},
      topic: options.topic
    }, {
      priority: options.priority === 'high' ? 1 : 5
    });
  }

  async addVerificationJob(vendorId, licenseNumber, licenseType, state) {
    return await this.queues.verification.add('verify-license', {
      vendorId,
      licenseNumber,
      licenseType,
      state
    }, {
      priority: 3 // Medium priority
    });
  }

  // Bulk Operations
  async addBulkSMSJobs(jobs) {
    const queueJobs = jobs.map(job => ({
      name: 'send-sms',
      data: job,
      opts: {
        priority: job.priority === 'high' ? 1 : 5
      }
    }));
    
    return await this.queues.sms.addBulk(queueJobs);
  }

  async addBulkEmailJobs(jobs) {
    const queueJobs = jobs.map(job => ({
      name: 'send-email',
      data: job,
      opts: {
        priority: job.priority === 'high' ? 1 : 5
      }
    }));
    
    return await this.queues.email.addBulk(queueJobs);
  }

  // Helper Methods (Mock Implementations)
  async rateLimitCheck(type, identifier) {
    const key = `rate_limit:${type}:${identifier}`;
    const current = await dbManager.getCache(key) || 0;
    
    if (type === 'sms' && current >= 1) { // 1 SMS per second limit
      throw new Error('SMS rate limit exceeded');
    }
    
    await dbManager.setCache(key, current + 1, 1); // 1 second TTL
  }

  async processTemplate(type, templateId, variables) {
    // Mock template processing
    const templates = {
      sms: {
        'welcome': 'Welcome {{name}} to FixRx! Your account is now active.',
        'invitation': 'Hi {{name}}, {{senderName}} invited you to connect on FixRx.'
      },
      email: {
        'welcome': {
          subject: 'Welcome to FixRx, {{name}}!',
          content: '<h1>Welcome {{name}}!</h1><p>Your FixRx account is ready.</p>'
        }
      }
    };

    let template = templates[type][templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (type === 'sms') {
      Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return template;
    } else {
      Object.entries(variables).forEach(([key, value]) => {
        template.subject = template.subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        template.content = template.content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return template;
    }
  }

  async sendSMS(phoneNumber, message) {
    // Mock Twilio SMS sending
    return {
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'sent',
      cost: 0.0075, // $0.0075 per SMS
      timestamp: new Date().toISOString()
    };
  }

  async sendEmail(emailData) {
    // Mock SendGrid email sending
    return {
      messageId: `email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  async sendPushNotification(pushData) {
    // Store notification in PostgreSQL database (Firebase removed)
    return {
      messageId: `db_notification_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'stored_in_db',
      timestamp: new Date().toISOString()
    };
  }

  async verifyLicense(licenseData) {
    // Mock license verification
    return {
      isValid: Math.random() > 0.1, // 90% success rate
      licenseNumber: licenseData.licenseNumber,
      licenseType: licenseData.licenseType,
      state: licenseData.state,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date().toISOString()
    };
  }

  async updateVendorVerification(vendorId, verification) {
    // Mock database update
    console.log(`📝 Updated vendor ${vendorId} verification:`, verification);
  }

  async logCommunication(type, data) {
    // Mock communication logging
    console.log(`📝 Communication Log [${type}]:`, data);
  }

  // Queue Statistics
  async getQueueStats() {
    const stats = {};
    
    for (const [queueName, queue] of Object.entries(this.queues)) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      stats[queueName] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    }
    
    return stats;
  }

  async pauseQueue(queueName) {
    if (this.queues[queueName]) {
      await this.queues[queueName].pause();
      return true;
    }
    return false;
  }

  async resumeQueue(queueName) {
    if (this.queues[queueName]) {
      await this.queues[queueName].resume();
      return true;
    }
    return false;
  }

  async close() {
    try {
      for (const [queueName, queue] of Object.entries(this.queues)) {
        await queue.close();
        console.log(`✅ Queue ${queueName} closed`);
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('❌ Queue Close Error:', error);
    }
  }
}

// Singleton instance
const queueManager = new QueueManager();

module.exports = {
  QueueManager,
  queueManager
};
