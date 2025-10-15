/**
 * Enhanced Invitation Service for FixRx
 * Integrates SMS invitations with existing invitation system
 * Includes contact import and management functionality
 */

const { SMSService } = require('./sms.service');
const { dbManager } = require('../config/database');
const { logger } = require('../utils/logger');
const { config } = require('../config/environment');
const { AppError } = require('../middleware/errorHandler');
const crypto = require('crypto');

class EnhancedInvitationService {
  constructor() {
    this.APP_DOWNLOAD_LINK = process.env.APP_DOWNLOAD_LINK || 'https://fixrx.com/app';
    this.WEB_APP_LINK = process.env.WEB_APP_LINK || 'https://app.fixrx.com';
  }

  /**
   * Generate or get user's referral code
   */
  async getReferralCode(userId) {
  console.log('DEBUG: Looking up user with ID:', userId);

  try {
    const client = await dbManager.getConnection();
    
    // Check if user already has a referral code
    let result = await client.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('DEBUG: User lookup result:', result.rows);

    if (result.rows[0]?.referral_code) {
      console.log('DEBUG: User already has referral code:', result.rows[0].referral_code);
      return result.rows[0].referral_code;
    }

    // Generate new referral code
    const userResult = await client.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    console.log('DEBUG: User details result:', userResult.rows);

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];
    const userName = `${user.first_name} ${user.last_name}`;
    const namePrefix = userName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let referralCode = `${namePrefix}${randomSuffix}`;

    console.log('DEBUG: Generated referral code:', referralCode);

    // Ensure uniqueness
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const checkResult = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );
      
      if (checkResult.rows.length === 0) {
        isUnique = true;
      } else {
        const newSuffix = Math.floor(1000 + Math.random() * 9000);
        referralCode = `${namePrefix}${newSuffix}`;
        attempts++;
        console.log('DEBUG: Referral code conflict, trying:', referralCode);
      }
    }

    if (!isUnique) {
      throw new AppError('Failed to generate unique referral code', 500);
    }

    // Update user with referral code
    await client.query(
      'UPDATE users SET referral_code = $1 WHERE id = $2',
      [referralCode, userId]
    );

    console.log('DEBUG: Saved referral code to database:', referralCode);
    return referralCode;

  } catch (error) {
    console.log('DEBUG: Error in getReferralCode:', error);
    logger.error('Failed to get/create referral code:', error);
    throw error;
  }
}

  /**
   * Enhanced create invitation with SMS support
   */
  async createEnhancedInvitation(userId, invitationData) {
    try {
      const client = await dbManager.getConnection();
      
      // Get user details
      const userResult = await client.query(
        'SELECT first_name, last_name, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];
      const inviterName = `${user.first_name} ${user.last_name}`;

      // Get or create referral code
      const referralCode = await this.getReferralCode(userId);

      // Create invitation record using existing structure
      const invitationId = crypto.randomUUID();
      const inviteToken = crypto.randomBytes(32).toString('hex');
      
      const insertQuery = `
      INSERT INTO invitations (
        id, user_id, inviter_id, recipient_email, recipient_phone, recipient_name,
        invitation_type, delivery_method, invite_token, referral_code,
        custom_message, status, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 
        NOW() + INTERVAL '7 days', NOW())
      RETURNING *
      `;

      const values = [
      invitationId,
      userId,        // Add this line for user_id
      userId,        // This is inviter_id
      invitationData.recipientEmail || null,
      invitationData.recipientPhone || null,
      invitationData.recipientName || null,
      invitationData.invitationType || 'FRIEND',
      invitationData.deliveryMethod || 'sms',
      inviteToken,
      referralCode,
      invitationData.customMessage || null
       ];

      const invitationResult = await client.query(insertQuery, values);
      const invitation = invitationResult.rows[0];

      // If SMS delivery is requested and phone number is provided
      if (invitation.delivery_method === 'sms' && invitation.recipient_phone) {
        const smsResult = await this.sendInvitationSMS(
          invitation,
          inviterName,
          referralCode
        );

        // Update invitation with SMS result
        await client.query(
          'UPDATE invitations SET sms_message_id = $1, sms_status = $2, last_sent_at = NOW() WHERE id = $3',
          [smsResult.messageId, smsResult.status, invitationId]
        );

        // Log the SMS sending
        await this.logInvitationAction(invitationId, 'sms_sent', {
          sms_result: smsResult,
          inviter_name: inviterName
        });
      }

      // If email delivery is requested and email is provided  
      if (invitation.delivery_method === 'email' && invitation.recipient_email) {
        // You can integrate with your existing email service here
        // const emailResult = await this.sendInvitationEmail(invitation, inviterName, referralCode);
      }

      logger.info('Enhanced invitation created', {
        invitationId,
        inviterId: userId,
        inviterName,
        type: invitation.invitation_type,
        delivery: invitation.delivery_method,
        referralCode
      });

      return {
        ...invitation,
        inviter_name: inviterName
      };

    } catch (error) {
      logger.error('Failed to create enhanced invitation:', error);
      throw error;
    }
  }

  /**
   * Send SMS invitation message
   */
  async sendInvitationSMS(invitation, inviterName, referralCode) {
    try {
      const formattedPhone = SMSService.formatPhoneNumber(invitation.recipient_phone);
      
      if (!SMSService.validatePhoneNumber(formattedPhone)) {
        throw new AppError('Invalid phone number format', 400);
      }

      let message;
      const greeting = invitation.recipient_name ? `Hi ${invitation.recipient_name}! ` : 'Hi! ';

      if (invitation.invitation_type === 'CONTRACTOR') {
        const servicePart = invitation.service_category ? ` especially for ${invitation.service_category} services` : '';
        message = `${greeting}${inviterName} recommends you join FixRx as a contractor${servicePart}. It's a great platform to connect with customers who need trusted professionals.\n\nJoin: ${this.APP_DOWNLOAD_LINK}\nUse code: ${referralCode}`;
      } else {
        // Friend invitation
        message = `${greeting}${inviterName} has been using FixRx to find trusted contractors through their network. It's been amazing! You should join and build your own trusted contractor network.\n\nDownload: ${this.APP_DOWNLOAD_LINK}\nUse code: ${referralCode}`;
      }

      // Use custom message if provided
      if (invitation.custom_message) {
        message = `${greeting}${invitation.custom_message}\n\nDownload: ${this.APP_DOWNLOAD_LINK}\nUse code: ${referralCode}`;
      }

      // Send SMS
      const smsResult = await SMSService.sendSMS(formattedPhone, message);


      return smsResult;

    } catch (error) {
      logger.error('Failed to send invitation SMS:', error);
      throw error;
    }
  }

  /**
   * Import contacts from various sources
   */
  async importContacts(userId, contactData, source = 'MANUAL') {
    try {
      const client = await dbManager.getConnection();
      const importId = crypto.randomUUID();
      const importedContacts = [];
      const duplicates = [];
      const errors = [];

      // Create import session record
      await client.query(`
        INSERT INTO contact_sync_sessions (
          id, user_id, sync_type, source, total_contacts, status, created_at
        ) VALUES ($1, $2, 'import', $3, $4, 'processing', NOW())
      `, [importId, userId, source, contactData.length]);

      // Process each contact
      for (const [index, contact] of contactData.entries()) {
        try {
          const contactId = crypto.randomUUID();
          const phoneNumber = contact.phoneNumber ? SMSService.formatPhoneNumber(contact.phoneNumber) : null;

          // Check for duplicates
          const existingContact = await client.query(`
            SELECT id FROM contacts 
            WHERE user_id = $1 AND (
              (email = $2 AND email IS NOT NULL) OR 
              (phone = $3 AND phone IS NOT NULL)
            )
          `, [userId, contact.email, phoneNumber]);

          if (existingContact.rows.length > 0) {
            duplicates.push({
              index,
              contact,
              reason: 'Duplicate email or phone number'
            });
            continue;
          }

          // Insert contact
          const insertResult = await client.query(`
            INSERT INTO contacts (
              id, user_id, first_name, last_name, email, phone, 
              contact_type, source, sync_session_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING *
          `, [
            contactId,
            userId,
            contact.firstName || contact.name?.split(' ')[0] || null,
            contact.lastName || contact.name?.split(' ').slice(1).join(' ') || null,
            contact.email || null,
            phoneNumber,
            contact.contactType || 'FRIEND',
            source,
            importId
          ]);

          importedContacts.push(insertResult.rows[0]);

        } catch (contactError) {
          logger.error(`Failed to import contact at index ${index}:`, contactError);
          errors.push({
            index,
            contact,
            error: contactError.message
          });
        }
      }

      // Update import session
      await client.query(`
        UPDATE contact_sync_sessions 
        SET status = 'completed', successful_imports = $1, 
            duplicates_skipped = $2, errors_count = $3, completed_at = NOW()
        WHERE id = $4
      `, [importedContacts.length, duplicates.length, errors.length, importId]);

      logger.info('Contact import completed', {
        userId,
        importId,
        total: contactData.length,
        imported: importedContacts.length,
        duplicates: duplicates.length,
        errors: errors.length,
        source
      });

      return {
        importId,
        summary: {
          total: contactData.length,
          imported: importedContacts.length,
          duplicates: duplicates.length,
          errors: errors.length
        },
        contacts: importedContacts,
        duplicates,
        errors
      };

    } catch (error) {
      logger.error('Contact import failed:', error);
      throw error;
    }
  }

  /**
   * Get user's contacts with filtering
   */
  async getContacts(userId, options = {}) {
    try {
      const client = await dbManager.getConnection();
      const {
        page = 1,
        limit = 50,
        search,
        contactType,
        source
      } = options;

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE user_id = $1';
      let params = [userId];
      let paramIndex = 2;

      if (search) {
        whereClause += ` AND (
          first_name ILIKE $${paramIndex} OR 
          last_name ILIKE $${paramIndex} OR 
          email ILIKE $${paramIndex} OR 
          phone ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (contactType) {
        whereClause += ` AND contact_type = $${paramIndex}`;
        params.push(contactType);
        paramIndex++;
      }

      if (source) {
        whereClause += ` AND source = $${paramIndex}`;
        params.push(source);
        paramIndex++;
      }

      // Get contacts
      const contactsQuery = `
        SELECT c.*, 
               i.id as invitation_id, i.status as invitation_status,
               i.created_at as invitation_sent_at
        FROM contacts c
        LEFT JOIN invitations i ON (c.phone = i.recipient_phone OR c.email = i.recipient_email)
          AND i.inviter_id = c.user_id
        ${whereClause}
        ORDER BY c.first_name, c.last_name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const contactsResult = await client.query(contactsQuery, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM contacts ${whereClause}`;
      const countParams = params.slice(0, paramIndex - 2); // Remove limit and offset
      const countResult = await client.query(countQuery, countParams);

      return {
        contacts: contactsResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to get contacts:', error);
      throw error;
    }
  }

  /**
   * Send bulk invitations to selected contacts
   */
  async sendBulkContactInvitations(userId, contactIds, invitationData) {
    try {
      const client = await dbManager.getConnection();
      
      // Get selected contacts
      const contactsResult = await client.query(`
        SELECT * FROM contacts 
        WHERE user_id = $1 AND id = ANY($2)
      `, [userId, contactIds]);

      const contacts = contactsResult.rows;
      const results = {
        total: contacts.length,
        successful: [],
        failed: [],
        duplicates: []
      };

      // Get user details for invitation
      const userResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];
      const inviterName = `${user.first_name} ${user.last_name}`;

      // Process each contact
      for (const contact of contacts) {
        try {
          // Check if already invited
          const existingInvitation = await client.query(`
            SELECT id FROM invitations 
            WHERE inviter_id = $1 AND (
              (recipient_phone = $2 AND recipient_phone IS NOT NULL) OR
              (recipient_email = $3 AND recipient_email IS NOT NULL)
            ) AND status IN ('pending', 'sent', 'delivered')
          `, [userId, contact.phone, contact.email]);

          if (existingInvitation.rows.length > 0) {
            results.duplicates.push({
              contactId: contact.id,
              name: `${contact.first_name} ${contact.last_name}`,
              reason: 'Already invited'
            });
            continue;
          }

          // Create invitation
          const enhancedData = {
            recipientEmail: contact.email,
            recipientPhone: contact.phone,
            recipientName: `${contact.first_name} ${contact.last_name}`.trim(),
            invitationType: invitationData.invitationType || contact.contact_type || 'FRIEND',
            deliveryMethod: contact.phone ? 'sms' : 'email',
            customMessage: invitationData.customMessage,
            serviceCategory: invitationData.serviceCategory
          };

          const invitation = await this.createEnhancedInvitation(userId, enhancedData);

          results.successful.push({
            contactId: contact.id,
            invitationId: invitation.id,
            name: `${contact.first_name} ${contact.last_name}`,
            deliveryMethod: invitation.delivery_method,
            status: 'sent'
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (contactError) {
          logger.error(`Failed to invite contact ${contact.id}:`, contactError);
          results.failed.push({
            contactId: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            error: contactError.message
          });
        }
      }

      logger.info('Bulk contact invitations completed', {
        userId,
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length
      });

      return results;

    } catch (error) {
      logger.error('Bulk contact invitations failed:', error);
      throw error;
    }
  }

  /**
   * Log invitation action
   */
  async logInvitationAction(invitationId, action, metadata = {}) {
    try {
      const client = await dbManager.getConnection();
      
      await client.query(`
        INSERT INTO invitation_logs (invitation_id, action, metadata, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [invitationId, action, JSON.stringify(metadata)]);

    } catch (error) {
      logger.error('Failed to log invitation action:', error);
      // Don't throw - logging failures shouldn't break main flow
    }
  }

  /**
   * Track invitation click/conversion from referral code
   */
  async trackInvitationClick(referralCode, phoneNumber = null, email = null) {
    try {
      const client = await dbManager.getConnection();
      
      // Find invitation by referral code and contact info
      let query = 'SELECT id FROM invitations WHERE referral_code = $1';
      let params = [referralCode];
      
      if (phoneNumber || email) {
        query += ' AND (recipient_phone = $2 OR recipient_email = $3)';
        params.push(phoneNumber, email);
      }

      const result = await client.query(query, params);

      if (result.rows.length > 0) {
        const invitationId = result.rows[0].id;
        
        // Update invitation status
        await client.query(
          'UPDATE invitations SET status = $1 WHERE id = $2 AND status = $3',
          ['clicked', invitationId, 'pending']
        );

        // Log the click
        await this.logInvitationAction(invitationId, 'clicked', {
          clicked_at: new Date().toISOString(),
          referral_code: referralCode,
          phone_number: phoneNumber,
          email: email
        });

        logger.info('Invitation click tracked', {
          invitationId,
          referralCode,
          phoneNumber,
          email
        });
      }

    } catch (error) {
      logger.error('Failed to track invitation click:', error);
      // Don't throw - tracking failures shouldn't break user flow
    }
  }

  /**
   * Get invitation analytics
   */
  async getInvitationAnalytics(userId, options = {}) {
    try {
      const client = await dbManager.getConnection();
      const { startDate, endDate, invitationType } = options;

      let dateFilter = '';
      let params = [userId];
      let paramIndex = 2;

      if (startDate) {
        dateFilter += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        dateFilter += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (invitationType) {
        dateFilter += ` AND invitation_type = $${paramIndex}`;
        params.push(invitationType);
        paramIndex++;
      }

      // Get overall stats
      const statsQuery = `
        SELECT 
          invitation_type,
          delivery_method,
          status,
          COUNT(*) as count
        FROM invitations 
        WHERE inviter_id = $1 ${dateFilter}
        GROUP BY invitation_type, delivery_method, status
      `;

      const clicksQuery = `
        SELECT COUNT(*) as clicks
        FROM invitation_logs il
        JOIN invitations i ON il.invitation_id = i.id
        WHERE i.inviter_id = $1 AND il.action = 'clicked' ${dateFilter}
      `;

      const [statsResult, clicksResult] = await Promise.all([
        client.query(statsQuery, params),
        client.query(clicksQuery, params)
      ]);

      return {
        stats: statsResult.rows,
        totalClicks: parseInt(clicksResult.rows[0].clicks),
        period: { startDate, endDate, invitationType }
      };

    } catch (error) {
      logger.error('Failed to get invitation analytics:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedInvitationService();