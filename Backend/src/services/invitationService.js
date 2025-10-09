/**
 * Enhanced Invitation Service for FixRx
 * Handles invitation management with SMS/Email integration and bulk processing
 */

const { dbManager } = require('../config/database');
const twilioService = require('./twilioService');
const emailService = require('./emailService');
const ContactService = require('./contactService');

class InvitationService {
  /**
   * Create invitation with contact integration
   */
  static async createInvitation(userId, invitationData) {
    const {
      recipientEmail,
      recipientPhone,
      recipientName,
      message,
      invitationType = 'vendor_invite',
      deliveryMethod = 'email', // 'email', 'sms', 'both'
      expiresIn = 7 // days
    } = invitationData;

    // Validate recipient information
    if (!recipientEmail && !recipientPhone) {
      throw new Error('Either email or phone number is required');
    }

    if (deliveryMethod === 'email' && !recipientEmail) {
      throw new Error('Email is required for email delivery');
    }

    if ((deliveryMethod === 'sms' || deliveryMethod === 'both') && !recipientPhone) {
      throw new Error('Phone number is required for SMS delivery');
    }

    try {
      // Check if contact exists, create if not
      let contactId = null;
      if (recipientEmail || recipientPhone) {
        const existingContacts = await ContactService.searchContactsByIdentifier(
          userId, 
          recipientEmail || recipientPhone
        );

        if (existingContacts.length > 0) {
          contactId = existingContacts[0].id;
        } else {
          // Create new contact
          const newContact = await ContactService.createContact(userId, {
            firstName: recipientName?.split(' ')[0] || '',
            lastName: recipientName?.split(' ').slice(1).join(' ') || '',
            email: recipientEmail,
            phone: recipientPhone,
            source: 'invitation'
          });
          contactId = newContact.id;
        }
      }

      // Create invitation record
      const invitation = await this.createInvitationRecord({
        userId,
        contactId,
        recipientEmail,
        recipientPhone,
        recipientName,
        message,
        invitationType,
        deliveryMethod,
        expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      });

      // Send invitation via selected method(s)
      const deliveryResults = await this.sendInvitation(invitation);

      // Update invitation with delivery results
      await this.updateInvitationDelivery(invitation.id, deliveryResults);

      return {
        ...invitation,
        deliveryResults
      };
    } catch (error) {
      console.error('Create invitation error:', error);
      throw error;
    }
  }

  /**
   * Send invitation via specified delivery method(s)
   */
  static async sendInvitation(invitation) {
    const results = {
      email: null,
      sms: null,
      errors: []
    };

    const inviteLink = this.generateInviteLink(invitation.invite_token);
    const personalizedMessage = this.personalizeMessage(invitation.message, {
      recipientName: invitation.recipient_name,
      inviteLink,
      senderName: invitation.sender_name || 'FixRx Team'
    });

    // Send email if required
    if (invitation.delivery_method === 'email' || invitation.delivery_method === 'both') {
      if (invitation.recipient_email) {
        try {
          const emailResult = await this.sendInvitationEmail({
            to: invitation.recipient_email,
            recipientName: invitation.recipient_name,
            message: personalizedMessage,
            inviteLink,
            invitationType: invitation.invitation_type
          });
          results.email = emailResult;
        } catch (error) {
          results.errors.push(`Email delivery failed: ${error.message}`);
        }
      }
    }

    // Send SMS if required
    if (invitation.delivery_method === 'sms' || invitation.delivery_method === 'both') {
      if (invitation.recipient_phone) {
        try {
          const smsResult = await this.sendInvitationSMS({
            to: invitation.recipient_phone,
            recipientName: invitation.recipient_name,
            message: personalizedMessage,
            inviteLink,
            invitationType: invitation.invitation_type
          });
          results.sms = smsResult;
        } catch (error) {
          results.errors.push(`SMS delivery failed: ${error.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(options) {
    const { to, recipientName, message, inviteLink, invitationType } = options;

    const emailTemplate = this.getEmailTemplate(invitationType);
    const subject = `You're invited to join FixRx${recipientName ? `, ${recipientName}` : ''}!`;

    const htmlContent = emailTemplate
      .replace('{{recipientName}}', recipientName || 'there')
      .replace('{{message}}', message)
      .replace('{{inviteLink}}', inviteLink)
      .replace('{{acceptButtonUrl}}', inviteLink);

    if (emailService && emailService.isAvailable()) {
      return await emailService.sendEmail({
        to,
        subject,
        html: htmlContent,
        templateId: 'invitation',
        variables: {
          recipientName,
          message,
          inviteLink
        }
      });
    } else {
      // Mock email sending for development
      return {
        id: `mock_email_${Date.now()}`,
        status: 'sent',
        to,
        subject
      };
    }
  }

  /**
   * Send invitation SMS
   */
  static async sendInvitationSMS(options) {
    const { to, recipientName, message, inviteLink, invitationType } = options;

    const smsTemplate = this.getSMSTemplate(invitationType);
    const smsBody = smsTemplate
      .replace('{{recipientName}}', recipientName || 'there')
      .replace('{{message}}', message)
      .replace('{{inviteLink}}', inviteLink);

    if (twilioService && twilioService.isAvailable()) {
      return await twilioService.sendSMS({
        to,
        body: smsBody,
        templateId: 'invitation'
      });
    } else {
      // Mock SMS sending for development
      return {
        id: `mock_sms_${Date.now()}`,
        status: 'sent',
        to
      };
    }
  }

  /**
   * Bulk invitation processing
   */
  static async createBulkInvitations(userId, invitationsData, options = {}) {
    const {
      batchName = `Bulk Invitations ${new Date().toISOString()}`,
      deliveryMethod = 'email',
      invitationType = 'vendor_invite',
      message = 'You\'re invited to join our platform!',
      expiresIn = 7
    } = options;

    if (!Array.isArray(invitationsData) || invitationsData.length === 0) {
      throw new Error('Invitations array is required and must not be empty');
    }

    if (invitationsData.length > 1000) {
      throw new Error('Maximum 1000 invitations allowed per batch');
    }

    // Create bulk batch record
    const batchId = await this.createBulkBatch({
      userId,
      batchName,
      totalInvitations: invitationsData.length,
      deliveryMethod,
      invitationType
    });

    const results = {
      batchId,
      successful: [],
      failed: [],
      duplicates: []
    };

    // Process each invitation
    for (const inviteData of invitationsData) {
      try {
        const invitation = await this.createInvitation(userId, {
          ...inviteData,
          deliveryMethod,
          invitationType,
          message: inviteData.message || message,
          expiresIn,
          batchId
        });

        results.successful.push({
          id: invitation.id,
          recipient: inviteData.recipientEmail || inviteData.recipientPhone,
          deliveryStatus: invitation.deliveryResults
        });
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          results.duplicates.push({
            recipient: inviteData.recipientEmail || inviteData.recipientPhone,
            error: error.message
          });
        } else {
          results.failed.push({
            recipient: inviteData.recipientEmail || inviteData.recipientPhone,
            error: error.message
          });
        }
      }
    }

    // Update batch record
    await this.updateBulkBatch(batchId, {
      processed_invitations: invitationsData.length,
      successful_invitations: results.successful.length,
      failed_invitations: results.failed.length,
      duplicate_invitations: results.duplicates.length,
      status: 'completed',
      completed_at: new Date()
    });

    return results;
  }

  /**
   * Resend invitation with method selection
   */
  static async resendInvitation(userId, invitationId, options = {}) {
    const { deliveryMethod = null, newMessage = null } = options;

    // Get existing invitation
    const invitation = await this.getInvitation(userId, invitationId);
    if (!invitation) {
      throw new Error('Invitation not found or access denied');
    }

    if (invitation.status === 'accepted') {
      throw new Error('Cannot resend accepted invitation');
    }

    if (invitation.status === 'expired') {
      throw new Error('Cannot resend expired invitation. Create a new invitation instead.');
    }

    // Update message if provided
    if (newMessage) {
      await this.updateInvitation(invitationId, { message: newMessage });
      invitation.message = newMessage;
    }

    // Update delivery method if provided
    if (deliveryMethod) {
      await this.updateInvitation(invitationId, { delivery_method: deliveryMethod });
      invitation.delivery_method = deliveryMethod;
    }

    // Generate new token for security
    const newToken = this.generateInviteToken();
    await this.updateInvitation(invitationId, { 
      invite_token: newToken,
      resent_count: (invitation.resent_count || 0) + 1,
      last_resent_at: new Date()
    });
    invitation.invite_token = newToken;

    // Send invitation
    const deliveryResults = await this.sendInvitation(invitation);

    // Update delivery results
    await this.updateInvitationDelivery(invitationId, deliveryResults);

    // Log resend action
    await this.logInvitationAction(invitationId, 'resent', {
      deliveryMethod: invitation.delivery_method,
      deliveryResults
    });

    return {
      id: invitationId,
      status: 'resent',
      deliveryResults
    };
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(inviteToken, acceptanceData = {}) {
    // Find invitation by token
    const invitation = await this.getInvitationByToken(inviteToken);
    
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status === 'accepted') {
      throw new Error('Invitation has already been accepted');
    }

    if (invitation.status === 'expired' || new Date() > new Date(invitation.expires_at)) {
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    await this.updateInvitation(invitation.id, {
      status: 'accepted',
      accepted_at: new Date(),
      acceptance_data: acceptanceData
    });

    // Log acceptance action
    await this.logInvitationAction(invitation.id, 'accepted', acceptanceData);

    return {
      id: invitation.id,
      status: 'accepted',
      invitationType: invitation.invitation_type,
      acceptedAt: new Date()
    };
  }

  /**
   * Get invitation analytics
   */
  static async getInvitationAnalytics(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      invitationType = null
    } = options;

    let whereClause = 'user_id = $1 AND created_at BETWEEN $2 AND $3';
    const queryParams = [userId, startDate, endDate];

    if (invitationType) {
      whereClause += ' AND invitation_type = $4';
      queryParams.push(invitationType);
    }

    const query = `
      SELECT 
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN delivery_method = 'email' THEN 1 END) as email_invites,
        COUNT(CASE WHEN delivery_method = 'sms' THEN 1 END) as sms_invites,
        COUNT(CASE WHEN delivery_method = 'both' THEN 1 END) as both_method_invites,
        AVG(CASE WHEN accepted_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (accepted_at - created_at))/3600 
        END) as avg_acceptance_time_hours
      FROM invitations 
      WHERE ${whereClause}
    `;

    const result = await dbManager.query(query, queryParams);
    const stats = result.rows[0];

    return {
      totalInvitations: parseInt(stats.total_invitations),
      sent: parseInt(stats.sent),
      accepted: parseInt(stats.accepted),
      expired: parseInt(stats.expired),
      failed: parseInt(stats.failed),
      acceptanceRate: stats.total_invitations > 0 ? 
        (stats.accepted / stats.total_invitations * 100).toFixed(2) : 0,
      deliveryMethods: {
        email: parseInt(stats.email_invites),
        sms: parseInt(stats.sms_invites),
        both: parseInt(stats.both_method_invites)
      },
      avgAcceptanceTimeHours: parseFloat(stats.avg_acceptance_time_hours || 0).toFixed(2)
    };
  }

  /**
   * Database operations
   */
  static async createInvitationRecord(data) {
    const inviteToken = this.generateInviteToken();
    
    const query = `
      INSERT INTO invitations (
        user_id, contact_id, recipient_email, recipient_phone, recipient_name,
        message, invitation_type, delivery_method, invite_token, expires_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.userId,
      data.contactId,
      data.recipientEmail,
      data.recipientPhone,
      data.recipientName,
      data.message,
      data.invitationType,
      data.deliveryMethod,
      inviteToken,
      data.expiresAt,
      'pending'
    ];

    const result = await dbManager.query(query, values);
    return result.rows[0];
  }

  static async updateInvitation(invitationId, updateData) {
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
      UPDATE invitations 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
    `;
    
    values.push(invitationId);
    await dbManager.query(query, values);
  }

  static async updateInvitationDelivery(invitationId, deliveryResults) {
    const hasSuccessfulDelivery = deliveryResults.email?.status === 'sent' || 
                                  deliveryResults.sms?.status === 'sent';
    
    const status = hasSuccessfulDelivery ? 'sent' : 'failed';
    const errorMessages = deliveryResults.errors.length > 0 ? 
                         deliveryResults.errors : null;

    await this.updateInvitation(invitationId, {
      status,
      sent_at: hasSuccessfulDelivery ? new Date() : null,
      delivery_results: deliveryResults,
      error_messages: errorMessages
    });
  }

  static async getInvitation(userId, invitationId) {
    const query = 'SELECT * FROM invitations WHERE id = $1 AND user_id = $2';
    const result = await dbManager.query(query, [invitationId, userId]);
    return result.rows[0];
  }

  static async getInvitationByToken(token) {
    const query = 'SELECT * FROM invitations WHERE invite_token = $1';
    const result = await dbManager.query(query, [token]);
    return result.rows[0];
  }

  static async createBulkBatch(data) {
    const query = `
      INSERT INTO invitation_bulk_batches (
        user_id, batch_name, total_invitations, delivery_method, invitation_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      data.userId,
      data.batchName,
      data.totalInvitations,
      data.deliveryMethod,
      data.invitationType,
      'processing'
    ];

    const result = await dbManager.query(query, values);
    return result.rows[0].id;
  }

  static async updateBulkBatch(batchId, updateData) {
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
      UPDATE invitation_bulk_batches 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    values.push(batchId);
    await dbManager.query(query, values);
  }

  static async logInvitationAction(invitationId, action, metadata = {}) {
    const query = `
      INSERT INTO invitation_logs (invitation_id, action, metadata)
      VALUES ($1, $2, $3)
    `;

    await dbManager.query(query, [invitationId, action, metadata]);
  }

  /**
   * Utility methods
   */
  static generateInviteToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  static generateInviteLink(token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
    return `${baseUrl}/invite/${token}`;
  }

  static personalizeMessage(template, variables) {
    let message = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    return message;
  }

  static getEmailTemplate(invitationType) {
    // Return appropriate email template based on invitation type
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join FixRx!</h2>
        <p>Hi {{recipientName}},</p>
        <p>{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{acceptButtonUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p>Or copy and paste this link: {{inviteLink}}</p>
        <p>Best regards,<br>The FixRx Team</p>
      </div>
    `;
  }

  static getSMSTemplate(invitationType) {
    return `Hi {{recipientName}}! {{message}} Join FixRx: {{inviteLink}}`;
  }

  /**
   * Setup database tables
   */
  static async setupTables() {
    const invitationsTable = `
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(20),
        recipient_name VARCHAR(255),
        message TEXT,
        invitation_type VARCHAR(50) DEFAULT 'vendor_invite',
        delivery_method VARCHAR(20) DEFAULT 'email',
        invite_token VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        accepted_at TIMESTAMP,
        resent_count INTEGER DEFAULT 0,
        last_resent_at TIMESTAMP,
        delivery_results JSONB,
        error_messages TEXT[],
        acceptance_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
      CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invite_token);
      CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
      CREATE INDEX IF NOT EXISTS idx_invitations_contact_id ON invitations(contact_id);
    `;

    const bulkBatchesTable = `
      CREATE TABLE IF NOT EXISTS invitation_bulk_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        batch_name VARCHAR(255),
        total_invitations INTEGER DEFAULT 0,
        processed_invitations INTEGER DEFAULT 0,
        successful_invitations INTEGER DEFAULT 0,
        failed_invitations INTEGER DEFAULT 0,
        duplicate_invitations INTEGER DEFAULT 0,
        delivery_method VARCHAR(20),
        invitation_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_invitation_batches_user_id ON invitation_bulk_batches(user_id);
      CREATE INDEX IF NOT EXISTS idx_invitation_batches_status ON invitation_bulk_batches(status);
    `;

    const logsTable = `
      CREATE TABLE IF NOT EXISTS invitation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_invitation_logs_invitation_id ON invitation_logs(invitation_id);
      CREATE INDEX IF NOT EXISTS idx_invitation_logs_action ON invitation_logs(action);
    `;

    await dbManager.query(invitationsTable);
    await dbManager.query(bulkBatchesTable);
    await dbManager.query(logsTable);
  }
}

module.exports = InvitationService;
