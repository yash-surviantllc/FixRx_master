const sgMail = require('@sendgrid/mail');
const { config } = require('../config/environment');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.isConfigured = false;
    this.initializeSendGrid();
  }

  static getInstance() {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  initializeSendGrid() {
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

  async sendEmail(emailData) {
    if (!this.isConfigured) {
      logger.error('SendGrid not configured, cannot send email');
      return {
        success: false,
        error: 'Email service not configured',
        to: emailData.to,
        status: 'failed'
      };
    }

    try {
      const message = {
        to: emailData.to,
        from: {
          email: emailData.from || config.sendgrid.fromEmail,
          name: config.sendgrid.fromName
        },
        subject: emailData.subject,
        replyTo: emailData.replyTo,
      };

      if (emailData.templateId) {
        message.templateId = emailData.templateId;
        if (emailData.templateData) {
          message.dynamicTemplateData = emailData.templateData;
        }
      } else {
        if (emailData.html) {
          message.html = emailData.html;
        }
        if (emailData.text) {
          message.text = emailData.text;
        }
      }

      if (emailData.attachments && emailData.attachments.length > 0) {
        message.attachments = emailData.attachments;
      }

      const response = await sgMail.send(message);

      logger.info('Email sent successfully', {
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
    } catch (error) {
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

  async sendBulkEmails(emails) {
    const results = [];
    let successful = 0;
    let failed = 0;

    logger.info(`Starting bulk email send for ${emails.length} emails`);

    try {
      const instance = this;

      if (!instance.isConfigured) {
        throw new Error('Email service not configured');
      }

      const bulkEmails = emails.map((email) => ({
        to: email.to,
        from: email.from || config.sendgrid.fromEmail,
        subject: email.subject,
        ...(email.templateId && { templateId: email.templateId }),
        ...(email.templateData && { dynamicTemplateData: email.templateData }),
        ...(email.html && { html: email.html }),
        ...(email.text && { text: email.text }),
      }));

      const response = await sgMail.send(bulkEmails);

      response.forEach((res, index) => {
        const result = {
          success: true,
          messageId: (res && res.headers && res.headers['x-message-id']) || 'bulk-' + Date.now(),
          to: emails[index].to,
          status: 'sent'
        };
        results.push(result);
        successful++;
      });
    } catch (error) {
      logger.error('Bulk email failed:', error);

      for (const email of emails) {
        const result = await EmailService.sendEmailStatic(email);
        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      return {
        total: emails.length,
        successful,
        failed,
        results,
      };
    }

    logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  async sendWelcomeEmail(to, firstName, verificationLink) {
    const templateData = {
      firstName,
      verificationLink,
      appName: 'FixRx',
      supportEmail: config.sendgrid.fromEmail,
    };

    if (config.sendgrid.templates.welcome) {
      return await this.sendEmail({
        to,
        subject: 'Welcome to FixRx!',
        templateId: config.sendgrid.templates.welcome,
        templateData,
      });
    }

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

    return await this.sendEmail({
      to,
      subject: 'Welcome to FixRx!',
      html,
    });
  }

  async sendInvitationEmail(to, inviterName, appLink, customMessage) {
    const templateData = {
      inviterName,
      appLink,
      customMessage,
      appName: 'FixRx',
    };

    if (config.sendgrid.templates.invitation) {
      return await this.sendEmail({
        to,
        subject: `${inviterName} invited you to join FixRx`,
        templateId: config.sendgrid.templates.invitation,
        templateData,
      });
    }

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

    return await this.sendEmail({
      to,
      subject: `${inviterName} invited you to join FixRx`,
      html,
    });
  }

  async sendPasswordResetEmail(to, firstName, resetLink) {
    const templateData = {
      firstName,
      resetLink,
      appName: 'FixRx',
    };

    if (config.sendgrid.templates.passwordReset) {
      return await this.sendEmail({
        to,
        subject: 'Reset Your FixRx Password',
        templateId: config.sendgrid.templates.passwordReset,
        templateData,
      });
    }

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

    return await this.sendEmail({
      to,
      subject: 'Reset Your FixRx Password',
      html,
    });
  }

  async sendNotificationEmail(to, subject, content, actionLink, actionText) {
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

    return await this.sendEmail({
      to,
      subject: `FixRx - ${subject}`,
      html,
    });
  }
}

EmailService.instance = null;

EmailService.sendEmailStatic = async function (emailData) {
  const instance = EmailService.getInstance();
  return instance.sendEmail(emailData);
};

module.exports = EmailService;
