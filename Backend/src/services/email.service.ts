import sgMail from '@sendgrid/mail';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

/**
 * Email Service using SendGrid for sending emails
 * Handles invitations, notifications, welcome emails, and password resets
 */

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to: string | string[];
  status: 'sent' | 'failed' | 'queued';
}

interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailResult[];
}

interface EmailTemplate {
  id: string;
  name: string;
  defaultData?: Record<string, any>;
}

class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean = false;

  private constructor() {
    this.initializeSendGrid();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeSendGrid(): void {
    if (config.sendgrid.apiKey) {
      try {
        sgMail.setApiKey(config.sendgrid.apiKey);
        this.isConfigured = true;
        logger.info('SendGrid email service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize SendGrid:', error);
        this.isConfigured = false;
      }
    } else {
      logger.warn('SendGrid API key not provided, email service disabled');
      this.isConfigured = false;
    }
  }

  /**
   * Send a single email
   */
  public static async sendEmail(emailData: EmailMessage): Promise<EmailResult> {
    const instance = EmailService.getInstance();
    
    if (!instance.isConfigured) {
      logger.error('SendGrid not configured, cannot send email');
      return {
        success: false,
        error: 'Email service not configured',
        to: emailData.to,
        status: 'failed'
      };
    }

    try {
      const message: any = {
        to: emailData.to,
        from: {
          email: emailData.from || config.sendgrid.fromEmail,
          name: config.sendgrid.fromName
        },
        subject: emailData.subject,
        replyTo: emailData.replyTo,
      };

      // Handle template-based emails
      if (emailData.templateId) {
        message.templateId = emailData.templateId;
        if (emailData.templateData) {
          message.dynamicTemplateData = emailData.templateData;
        }
      } else {
        // Handle content-based emails
        if (emailData.html) {
          message.html = emailData.html;
        }
        if (emailData.text) {
          message.text = emailData.text;
        }
      }

      // Add attachments if provided
      if (emailData.attachments && emailData.attachments.length > 0) {
        message.attachments = emailData.attachments;
      }

      const response = await sgMail.send(message);

      logger.info(`Email sent successfully`, {
        to: emailData.to,
        subject: emailData.subject,
        messageId: response[0].headers['x-message-id'],
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        to: emailData.to,
        status: 'sent'
      };

    } catch (error: any) {
      logger.error('Failed to send email:', {
        to: emailData.to,
        subject: emailData.subject,
        error: error.message,
        code: error.code,
        response: error.response?.body || error.response,
      });

      return {
        success: false,
        error: error.message,
        to: emailData.to,
        status: 'failed'
      };
    }
  }

  /**
   * Send bulk emails
   */
  public static async sendBulkEmails(emails: EmailMessage[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    logger.info(`Starting bulk email send for ${emails.length} emails`);

    // SendGrid can handle bulk emails in a single request
    try {
      const instance = EmailService.getInstance();
      
      if (!instance.isConfigured) {
        throw new Error('Email service not configured');
      }

      // Prepare bulk email data
      const bulkEmails = emails.map(email => ({
        to: email.to,
        from: email.from || config.sendgrid.fromEmail,
        subject: email.subject,
        ...(email.templateId && { templateId: email.templateId }),
        ...(email.templateData && { dynamicTemplateData: email.templateData }),
        ...(email.html && { html: email.html }),
        ...(email.text && { text: email.text }),
      }));

      const response = await sgMail.send(bulkEmails);

      // Process results
      response.forEach((res: any, index) => {
        const result: EmailResult = {
          success: true,
          messageId: (res && res.headers && res.headers['x-message-id']) || 'bulk-' + Date.now(),
          to: emails[index].to,
          status: 'sent'
        };
        results.push(result);
        successful++;
      });

    } catch (error: any) {
      logger.error('Bulk email failed:', error);
      
      // If bulk fails, fall back to individual sends
      for (const email of emails) {
        const result = await EmailService.sendEmail(email);
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }
    }

    logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);

    return {
      total: emails.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Send welcome email with template
   */
  public static async sendWelcomeEmail(
    to: string, 
    firstName: string, 
    verificationLink?: string
  ): Promise<EmailResult> {
    const templateData = {
      firstName,
      verificationLink,
      appName: 'FixRx',
      supportEmail: config.sendgrid.fromEmail,
    };

    if (config.sendgrid.templates.welcome) {
      // Use template if available
      return await EmailService.sendEmail({
        to,
        subject: 'Welcome to FixRx!',
        templateId: config.sendgrid.templates.welcome,
        templateData,
      });
    } else {
      // Fall back to simple HTML email
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to FixRx, ${firstName}!</h1>
          <p>Thank you for joining FixRx - your trusted platform for connecting with service providers.</p>
          ${verificationLink ? `
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          ` : ''}
          <p>If you have any questions, feel free to contact us at ${config.sendgrid.fromEmail}</p>
          <p>Best regards,<br>The FixRx Team</p>
        </div>
      `;

      return await EmailService.sendEmail({
        to,
        subject: 'Welcome to FixRx!',
        html,
      });
    }
  }

  /**
   * Send invitation email
   */
  public static async sendInvitationEmail(
    to: string,
    inviterName: string,
    appLink: string,
    customMessage?: string
  ): Promise<EmailResult> {
    const templateData = {
      inviterName,
      appLink,
      customMessage,
      appName: 'FixRx',
    };

    if (config.sendgrid.templates.invitation) {
      return await EmailService.sendEmail({
        to,
        subject: `${inviterName} invited you to join FixRx`,
        templateId: config.sendgrid.templates.invitation,
        templateData,
      });
    } else {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">You're Invited to Join FixRx!</h1>
          <p>${inviterName} has invited you to join FixRx - the trusted platform for finding reliable service providers.</p>
          ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
          <p>Download the app and get started:</p>
          <a href="${appLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join FixRx Now
          </a>
          <p>Best regards,<br>The FixRx Team</p>
        </div>
      `;

      return await EmailService.sendEmail({
        to,
        subject: `${inviterName} invited you to join FixRx`,
        html,
      });
    }
  }

  /**
   * Send password reset email
   */
  public static async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetLink: string
  ): Promise<EmailResult> {
    const templateData = {
      firstName,
      resetLink,
      appName: 'FixRx',
    };

    if (config.sendgrid.templates.passwordReset) {
      return await EmailService.sendEmail({
        to,
        subject: 'Reset Your FixRx Password',
        templateId: config.sendgrid.templates.passwordReset,
        templateData,
      });
    } else {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hi ${firstName},</p>
          <p>You requested to reset your FixRx password. Click the link below to create a new password:</p>
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The FixRx Team</p>
        </div>
      `;

      return await EmailService.sendEmail({
        to,
        subject: 'Reset Your FixRx Password',
        html,
      });
    }
  }

  /**
   * Send notification email
   */
  public static async sendNotificationEmail(
    to: string,
    subject: string,
    content: string,
    actionLink?: string,
    actionText?: string
  ): Promise<EmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">FixRx Notification</h1>
        <p>${content}</p>
        ${actionLink ? `
          <a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${actionText || 'View Details'}
          </a>
        ` : ''}
        <p>Best regards,<br>The FixRx Team</p>
      </div>
    `;

    return await EmailService.sendEmail({
      to,
      subject: `FixRx - ${subject}`,
      html,
    });
  }

  /**
   * Validate email address format
   */
  public static validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Health check for email service
   */
  public static async healthCheck(): Promise<boolean> {
    const instance = EmailService.getInstance();
    
    if (!instance.isConfigured) {
      return false;
    }

    try {
      // SendGrid doesn't have a simple ping endpoint, so we'll just check if we can initialize
      return true;
    } catch (error) {
      logger.error('Email service health check failed:', error);
      return false;
    }
  }
}

export { EmailService, EmailMessage, EmailResult, BulkEmailResult, EmailTemplate };
export default EmailService;
