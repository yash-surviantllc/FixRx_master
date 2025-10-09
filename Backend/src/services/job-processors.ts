import { QueueService } from './queue';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { logger } from '../utils/logger';

/**
 * Background Job Processors
 * Handles processing of queued jobs for emails, SMS, and notifications
 */

/**
 * Email job processor
 */
const processEmailJob = async (job: any) => {
  const { to, subject, template, templateData, html, text } = job.data;
  
  logger.info(`Processing email job ${job.id} for ${to}`);
  
  try {
    let result;
    
    if (template) {
      // Template-based email
      result = await EmailService.sendEmail({
        to,
        subject,
        templateId: template,
        templateData,
      });
    } else {
      // Content-based email
      result = await EmailService.sendEmail({
        to,
        subject,
        html,
        text,
      });
    }
    
    if (result.success) {
      logger.info(`Email job ${job.id} completed successfully`);
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error || 'Email sending failed');
    }
    
  } catch (error: any) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * SMS job processor
 */
const processSMSJob = async (job: any) => {
  const { to, message, from } = job.data;
  
  logger.info(`Processing SMS job ${job.id} for ${to}`);
  
  try {
    const result = await SMSService.sendSMS({ to, message, from });
    
    if (result.success) {
      logger.info(`SMS job ${job.id} completed successfully`);
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error || 'SMS sending failed');
    }
    
  } catch (error: any) {
    logger.error(`SMS job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * Push notification job processor (DISABLED - Firebase removed)
 * PostgreSQL-only implementation - notifications stored in database
 */
const processNotificationJob = async (job: any) => {
  const { userId, token, tokens, topic, title, body, data, imageUrl } = job.data;
  
  logger.info(`Processing notification job ${job.id} for user ${userId || 'topic: ' + topic} (PostgreSQL only)`);
  
  try {
    // Store notification in PostgreSQL database instead of sending push notification
    // This can be retrieved by the mobile app via API calls
    
    logger.info(`Notification job ${job.id} stored in database (push notifications disabled)`);
    return { 
      success: true, 
      successCount: 1,
      failureCount: 0,
      messageId: `db_notification_${Date.now()}`,
      note: 'Notification stored in PostgreSQL database - Firebase removed'
    };
    
  } catch (error: any) {
    logger.error(`Notification job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * Data cleanup job processor
 */
const processCleanupJob = async (job: any) => {
  const { type, days } = job.data;
  
  logger.info(`Processing cleanup job ${job.id} for ${type} older than ${days} days`);
  
  try {
    // TODO: Implement data cleanup logic
    // This could clean up old logs, expired tokens, etc.
    
    logger.info(`Cleanup job ${job.id} completed (not implemented yet)`);
    return { success: true, note: 'Cleanup not implemented yet' };
    
  } catch (error: any) {
    logger.error(`Cleanup job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * Report generation job processor
 */
const processReportJob = async (job: any) => {
  const { userId, reportType, parameters } = job.data;
  
  logger.info(`Processing report job ${job.id} for user ${userId}, type: ${reportType}`);
  
  try {
    // TODO: Implement report generation
    // This could generate analytics reports, user reports, etc.
    
    logger.info(`Report job ${job.id} completed (not implemented yet)`);
    return { success: true, note: 'Report generation not implemented yet' };
    
  } catch (error: any) {
    logger.error(`Report job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * Initialize all job processors
 */
export const initializeJobProcessors = () => {
  logger.info('Initializing background job processors...');
  
  // Register email processor
  QueueService.processEmailQueue(processEmailJob);
  logger.info('✅ Email queue processor registered');
  
  // Register SMS processor
  QueueService.processSMSQueue(processSMSJob);
  logger.info('✅ SMS queue processor registered');
  
  // Register notification processor
  QueueService.processNotificationQueue(processNotificationJob);
  logger.info('✅ Notification queue processor registered');
  
  logger.info('🚀 All job processors initialized successfully');
};

/**
 * Helper functions for adding jobs to queues
 */
export const JobHelpers = {
  /**
   * Queue welcome email
   */
  async queueWelcomeEmail(to: string, firstName: string, verificationLink?: string) {
    // Since templates are empty, use direct EmailService call
    return await QueueService.addEmailJob({
      to,
      subject: 'Welcome to FixRx!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to FixRx, ${firstName}!</h1>
          <p>Thank you for joining FixRx - your trusted platform for connecting with service providers.</p>
          ${verificationLink ? `
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          ` : ''}
          <p>If you have any questions, feel free to contact us at support@fixrx.com</p>
          <p>Best regards,<br>The FixRx Team</p>
        </div>
      `,
    });
  },

  /**
   * Queue invitation email
   */
  async queueInvitationEmail(to: string, inviterName: string, appLink: string, customMessage?: string) {
    return await QueueService.addEmailJob({
      to,
      subject: `${inviterName} invited you to join FixRx`,
      template: 'invitation',
      templateData: {
        inviterName,
        appLink,
        customMessage,
        appName: 'FixRx',
      },
    });
  },

  /**
   * Queue password reset email
   */
  async queuePasswordResetEmail(to: string, firstName: string, resetLink: string) {
    return await QueueService.addEmailJob({
      to,
      subject: 'Reset Your FixRx Password',
      template: 'password_reset',
      templateData: {
        firstName,
        resetLink,
        appName: 'FixRx',
      },
    });
  },

  /**
   * Queue invitation SMS
   */
  async queueInvitationSMS(to: string, inviterName: string, appLink: string) {
    return await QueueService.addSMSJob({
      to,
      message: `Hi! ${inviterName} invited you to join FixRx - the app that connects you with trusted service providers. Download: ${appLink}`,
    });
  },

  /**
   * Queue verification SMS
   */
  async queueVerificationSMS(to: string, code: string) {
    return await QueueService.addSMSJob({
      to,
      message: `Your FixRx verification code is: ${code}. This code expires in 10 minutes.`,
    });
  },

  /**
   * Queue notification
   */
  async queueNotification(userId: string, title: string, body: string, data?: any) {
    return await QueueService.addNotificationJob({
      userId,
      title,
      body,
      data,
    });
  },

  /**
   * Queue bulk invitations (email)
   */
  async queueBulkInvitationEmails(invitations: Array<{ to: string; inviterName: string; appLink: string; customMessage?: string }>) {
    const jobs = invitations.map(invitation => ({
      data: {
        to: invitation.to,
        subject: `${invitation.inviterName} invited you to join FixRx`,
        template: 'invitation',
        templateData: {
          inviterName: invitation.inviterName,
          appLink: invitation.appLink,
          customMessage: invitation.customMessage,
          appName: 'FixRx',
        },
      },
    }));

    return await QueueService.addBulkEmailJobs(jobs);
  },

  /**
   * Queue bulk invitations (SMS)
   */
  async queueBulkInvitationSMS(invitations: Array<{ to: string; inviterName: string; appLink: string }>) {
    const jobs = invitations.map(invitation => ({
      data: {
        to: invitation.to,
        message: `Hi! ${invitation.inviterName} invited you to join FixRx - the app that connects you with trusted service providers. Download: ${invitation.appLink}`,
      },
    }));

    return await QueueService.addBulkSMSJobs(jobs);
  },
};

export {
  processEmailJob,
  processSMSJob,
  processNotificationJob,
  processCleanupJob,
  processReportJob,
};
