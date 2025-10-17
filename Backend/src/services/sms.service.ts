import twilio from 'twilio';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * SMS Service using Twilio for sending text messages
 * Handles invitations, notifications, and verification codes
 */

interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to: string;
  status: 'sent' | 'failed' | 'queued';
}

interface BulkSMSResult {
  total: number;
  successful: number;
  failed: number;
  results: SMSResult[];
}

class SMSService {
  private static instance: SMSService;
  private client: twilio.Twilio | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.initializeTwilio();
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  private initializeTwilio(): void {
    if (config.twilio.accountSid && config.twilio.authToken) {
      try {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.isConfigured = true;
        logger.info('Twilio SMS service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Twilio:', error);
        this.isConfigured = false;
      }
    } else {
      logger.warn('Twilio credentials not provided, SMS service disabled');
      this.isConfigured = false;
    }
  }

  /**
   * Send a single SMS message
   */
  public static async sendSMS(smsData: SMSMessage): Promise<SMSResult> {
    const instance = SMSService.getInstance();
    
    if (!instance.isConfigured || !instance.client) {
      logger.error('Twilio not configured, cannot send SMS');
      return {
        success: false,
        error: 'SMS service not configured',
        to: smsData.to,
        status: 'failed'
      };
    }

    try {
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(smsData.to)) {
        throw new AppError('Invalid phone number format. Must include country code.', 400);
      }

      // Send SMS via Twilio
      const message = await instance.client.messages.create({
        body: smsData.message,
        from: smsData.from || config.twilio.phoneNumber,
        to: smsData.to,
      });

      logger.info(`SMS sent successfully to ${smsData.to}`, {
        messageId: message.sid,
        status: message.status,
      });

      return {
        success: true,
        messageId: message.sid,
        to: smsData.to,
        status: 'sent'
      };

    } catch (error: any) {
      logger.error('Failed to send SMS:', {
        to: smsData.to,
        error: error.message,
        code: error.code,
      });

      return {
        success: false,
        error: error.message,
        to: smsData.to,
        status: 'failed'
      };
    }
  }

  /**
   * Send bulk SMS messages with rate limiting
   */
  public static async sendBulkSMS(messages: SMSMessage[]): Promise<BulkSMSResult> {
    const results: SMSResult[] = [];
    let successful = 0;
    let failed = 0;

    logger.info(`Starting bulk SMS send for ${messages.length} messages`);

    for (const [index, message] of messages.entries()) {
      try {
        // Rate limiting - delay between messages to comply with Twilio limits
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        const result = await SMSService.sendSMS(message);
        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

      } catch (error: any) {
        logger.error(`Bulk SMS failed for message ${index}:`, error);
        results.push({
          success: false,
          error: error.message,
          to: message.to,
          status: 'failed'
        });
        failed++;
      }
    }

    logger.info(`Bulk SMS completed: ${successful} successful, ${failed} failed`);

    return {
      total: messages.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Send invitation SMS
   */
  public static async sendInvitationSMS(to: string, inviterName: string, appLink: string): Promise<SMSResult> {
    const message = `Hi! ${inviterName} invited you to join FixRx - the app that connects you with trusted service providers. Download: ${appLink}`;
    
    return await SMSService.sendSMS({
      to,
      message
    });
  }

  /**
   * Send verification code SMS
   */
  public static async sendVerificationSMS(to: string, code: string): Promise<SMSResult> {
    const message = `Your FixRx verification code is: ${code}. This code expires in 10 minutes.`;
    
    return await SMSService.sendSMS({
      to,
      message
    });
  }

  /**
   * Send notification SMS
   */
  public static async sendNotificationSMS(to: string, title: string, content: string): Promise<SMSResult> {
    const message = `FixRx - ${title}: ${content}`;
    
    return await SMSService.sendSMS({
      to,
      message
    });
  }

  /**
   * Send password reset SMS
   */
  public static async sendPasswordResetSMS(to: string, resetLink: string): Promise<SMSResult> {
    const message = `Reset your FixRx password: ${resetLink}. If you didn't request this, please ignore.`;
    
    return await SMSService.sendSMS({
      to,
      message
    });
  }

  /**
   * Validate phone number format
   */
  public static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format phone number for SMS (ensure it has country code)
   */
  public static formatPhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with country code, add + prefix
    if (cleaned.length > 10 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's a 10-digit US number, add +1
    if (cleaned.length === 10) {
      return `${defaultCountryCode}${cleaned}`;
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add the provided country code
    return `${defaultCountryCode}${cleaned}`;
  }

  /**
   * Check SMS delivery status
   */
  public static async getMessageStatus(messageId: string): Promise<string | null> {
    const instance = SMSService.getInstance();
    
    if (!instance.isConfigured || !instance.client) {
      return null;
    }

    try {
      const message = await instance.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      logger.error('Failed to fetch message status:', error);
      return null;
    }
  }

  /**
   * Get account balance (for monitoring)
   */
  public static async getAccountBalance(): Promise<number | null> {
    const instance = SMSService.getInstance();
    
    if (!instance.isConfigured || !instance.client) {
      return null;
    }

    try {
      // Simplified balance check - return 0 for test/dev
      if (config.nodeEnv !== 'production') {
        logger.info('SMS service balance check (dev mode): returning mock balance');
        return 10.00; // Mock balance for development
      }
      
      const account = await instance.client.api.v2010.accounts(config.twilio.accountSid).fetch();
      const balance = account.balance;
      return balance ? parseFloat(String(balance)) : 0;
    } catch (error) {
      logger.error('Failed to fetch account balance:', error);
      return null;
    }
  }

  /**
   * Health check for SMS service
   */
  public static async healthCheck(): Promise<boolean> {
    const instance = SMSService.getInstance();
    
    if (!instance.isConfigured || !instance.client) {
      return false;
    }

    try {
      // Try to fetch account info as a health check
      await instance.client.api.v2010.accounts(config.twilio.accountSid).fetch();
      return true;
    } catch (error) {
      logger.error('SMS service health check failed:', error);
      return false;
    }
  }
}

export { SMSService, SMSMessage, SMSResult, BulkSMSResult };
export default SMSService;
