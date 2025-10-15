/**
 * Invitation Controller for FixRx
 * Handles invitation management with bulk operations, contact integration, and SMS functionality
 */


const Joi = require('joi');

// const USE_MOCKS = process.env.USE_MOCKS === 'true';
const { logger } = require('../utils/logger');

const InvitationService = require('../services/invitationService');
const enhancedInvitationService = require('../services/enhancedInvitationService');

// const InvitationService = USE_MOCKS 
//   ? require('../services/__mocks__/mockEnhancedInvitationService')  // Use same mock for both
//   : require('../services/invitationService');

// const enhancedInvitationService = USE_MOCKS 
//   ? require('../services/__mocks__/mockEnhancedInvitationService')
//   : require('../services/enhancedInvitationService');

class InvitationController {
  /**
   * Create single invitation (existing method enhanced)
   * POST /api/v1/invitations
   */
  static async createInvitation(req, res) {
    try {
      const userId = req.user.userId;
      const invitationData = req.body;

      // Validate required fields
      if (!invitationData.recipientEmail && !invitationData.recipientPhone) {
        return res.status(400).json({
          success: false,
          message: 'Either recipientEmail or recipientPhone is required'
        });
      }

      // Use enhanced service if SMS delivery is requested
      let invitation;
      if (invitationData.deliveryMethod === 'sms' && invitationData.recipientPhone) {
        invitation = await enhancedInvitationService.createEnhancedInvitation(userId, invitationData);
      } else {
        invitation = await InvitationService.createInvitation(userId, invitationData);
      }

      res.status(201).json({
        success: true,
        data: invitation,
        message: 'Invitation created and sent successfully'
      });
    } catch (error) {
      console.error('Create invitation error:', error);
      
      if (error.message.includes('required') || error.message.includes('invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create invitation',
        error: error.message
      });
    }
  }

  /**
   * Send friend invitation via SMS
   * POST /api/v1/invitations/friend-sms
   */
  static async sendFriendSMS(req, res) {
    try {
      // Validate request
      const schema = Joi.object({
        phoneNumber: Joi.string().required().messages({
          'any.required': 'Phone number is required'
        }),
        recipientName: Joi.string().optional().allow(''),
        customMessage: Joi.string().optional().allow('').max(300)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const userId = req.user.userId;
      const { phoneNumber, recipientName, customMessage } = value;

      // Create enhanced invitation for friend
      const invitationData = {
        recipientPhone: phoneNumber,
        recipientName: recipientName || null,
        invitationType: 'FRIEND',
        deliveryMethod: 'sms',
        customMessage: customMessage || null
      };

      const invitation = await enhancedInvitationService.createEnhancedInvitation(userId, invitationData);

      res.status(200).json({
        success: true,
        data: {
          invitationId: invitation.id,
          phoneNumber: invitation.recipient_phone,
          recipientName: invitation.recipient_name,
          referralCode: invitation.referral_code,
          status: invitation.status
        },
        message: 'Friend invitation sent successfully via SMS'
      });

    } catch (error) {
      logger.error('Send friend SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send friend invitation',
        error: error.message
      });
    }
  }

  /**
   * Send contractor invitation via SMS
   * POST /api/v1/invitations/contractor-sms
   */
  static async sendContractorSMS(req, res) {
    try {
      // Validate request
      const schema = Joi.object({
        phoneNumber: Joi.string().required().messages({
          'any.required': 'Phone number is required'
        }),
        recipientName: Joi.string().optional().allow(''),
        serviceCategory: Joi.string().optional().allow(''),
        customMessage: Joi.string().optional().allow('').max(300)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const userId = req.user.userId;
      const { phoneNumber, recipientName, serviceCategory, customMessage } = value;

      // Create enhanced invitation for contractor
      const invitationData = {
        recipientPhone: phoneNumber,
        recipientName: recipientName || null,
        invitationType: 'CONTRACTOR',
        deliveryMethod: 'sms',
        serviceCategory: serviceCategory || null,
        customMessage: customMessage || null
      };

      const invitation = await enhancedInvitationService.createEnhancedInvitation(userId, invitationData);

      res.status(200).json({
        success: true,
        data: {
          invitationId: invitation.id,
          phoneNumber: invitation.recipient_phone,
          recipientName: invitation.recipient_name,
          serviceCategory: invitation.service_category,
          referralCode: invitation.referral_code,
          status: invitation.status
        },
        message: 'Contractor invitation sent successfully via SMS'
      });

    } catch (error) {
      logger.error('Send contractor SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send contractor invitation',
        error: error.message
      });
    }
  }

  /**
   * Import contacts from CSV, JSON, or phone contacts
   * POST /api/v1/invitations/contacts/import
   */
  static async importContacts(req, res) {
    try {
      const schema = Joi.object({
        contacts: Joi.array().items(
          Joi.object({
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phoneNumber: Joi.string().optional(),
            contactType: Joi.string().valid('FRIEND', 'CONTRACTOR').default('FRIEND')
          })
        ).required().max(5000).messages({
          'array.max': 'Cannot import more than 5000 contacts at once'
        }),
        source: Joi.string().valid('CSV', 'PHONE', 'GOOGLE', 'MANUAL').default('MANUAL')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const userId = req.user.userId;
      const { contacts, source } = value;

      // Validate at least one contact has email or phone
      const validContacts = contacts.filter(contact => contact.email || contact.phoneNumber);
      if (validContacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one contact must have an email or phone number'
        });
      }

      const result = await enhancedInvitationService.importContacts(userId, validContacts, source);

      res.status(200).json({
        success: true,
        data: {
          importId: result.importId,
          summary: result.summary,
          importedContacts: result.contacts.length,
          duplicatesSkipped: result.duplicates.length,
          errors: result.errors.length
        },
        message: `Contact import completed: ${result.summary.imported} imported, ${result.summary.duplicates} duplicates, ${result.summary.errors} errors`
      });

    } catch (error) {
      logger.error('Import contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import contacts',
        error: error.message
      });
    }
  }

  /**
   * Get user's contacts
   * GET /api/v1/invitations/contacts
   */
  static async getContacts(req, res) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 50,
        search,
        contactType,
        source
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        search,
        contactType,
        source
      };

      const result = await enhancedInvitationService.getContacts(userId, options);

      res.status(200).json({
        success: true,
        data: result.contacts,
        pagination: result.pagination,
        message: `Retrieved ${result.contacts.length} contacts`
      });

    } catch (error) {
      logger.error('Get contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contacts',
        error: error.message
      });
    }
  }

  /**
   * Send invitations to selected contacts
   * POST /api/v1/invitations/contacts/invite
   */
  static async inviteContacts(req, res) {
    try {
      const schema = Joi.object({
        contactIds: Joi.array().items(Joi.string()).required().min(1).max(100).messages({
          'array.min': 'At least one contact must be selected',
          'array.max': 'Cannot invite more than 100 contacts at once'
        }),
        invitationType: Joi.string().valid('FRIEND', 'CONTRACTOR').default('FRIEND'),
        customMessage: Joi.string().optional().allow('').max(300),
        serviceCategory: Joi.string().optional().allow('')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const userId = req.user.userId;
      const { contactIds, invitationType, customMessage, serviceCategory } = value;

      const invitationData = {
        invitationType,
        customMessage: customMessage || null,
        serviceCategory: serviceCategory || null
      };

      const result = await enhancedInvitationService.inviteContacts(
      userId, 
      contactIds, 
      invitationData
       );

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total: result.total,
            successful: result.successful.length,
            failed: result.failed.length,
            duplicates: result.duplicates.length
          },
          results: result
        },
        message: `Bulk invitations completed: ${result.successful.length} sent, ${result.failed.length} failed, ${result.duplicates.length} already invited`
      });

    } catch (error) {
      logger.error('Invite contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitations to contacts',
        error: error.message
      });
    }
  }

  /**
   * Get user's referral code
   * GET /api/v1/invitations/referral-code
   */
  static async getReferralCode(req, res) {
    try {
      const userId = req.user.userId;
      const referralCode = await enhancedInvitationService.getReferralCode(userId);

      res.status(200).json({
        success: true,
        data: {
          referralCode,
          shareUrl: `${process.env.FRONTEND_URL}/join?ref=${referralCode}`,
          downloadUrl: `${process.env.APP_DOWNLOAD_LINK}?ref=${referralCode}`
        },
        message: 'Referral code retrieved successfully'
      });

    } catch (error) {
      logger.error('Get referral code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get referral code',
        error: error.message
      });
    }
  }

  /**
   * Track invitation click (public endpoint)
   * POST /api/v1/invitations/track-click
   */
  static async trackClick(req, res) {
    try {
      const { referralCode, phoneNumber, email } = req.body;

      if (!referralCode) {
        return res.status(400).json({
          success: false,
          message: 'Referral code is required'
        });
      }

      // Track the click
      await enhancedInvitationService.trackInvitationClick(referralCode, phoneNumber, email);

      res.status(200).json({
        success: true,
        message: 'Click tracked successfully'
      });

    } catch (error) {
      logger.error('Track click error:', error);
      // Don't fail the request even if tracking fails
      res.status(200).json({
        success: true,
        message: 'Click acknowledged'
      });
    }
  }

  // Keep all existing methods...
  
  /**
   * Create bulk invitations (existing method)
   * POST /api/v1/invitations/bulk
   */
  static async createBulkInvitations(req, res) {
    try {
      const userId = req.user.userId;
      const { invitations, options = {} } = req.body;

      if (!Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invitations array is required and must not be empty'
        });
      }

      if (invitations.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 1000 invitations allowed per batch'
        });
      }

      const results = await InvitationService.createBulkInvitations(userId, invitations, options);

      res.json({
        success: true,
        data: {
          batchId: results.batchId,
          summary: {
            total: invitations.length,
            successful: results.successful.length,
            failed: results.failed.length,
            duplicates: results.duplicates.length
          },
          details: results
        },
        message: `Bulk invitation completed: ${results.successful.length} sent, ${results.failed.length} failed, ${results.duplicates.length} duplicates`
      });
    } catch (error) {
      console.error('Bulk invitations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk invitations',
        error: error.message
      });
    }
  }

  /**
   * Get invitations with filtering (existing method)
   * GET /api/v1/invitations
   */
  static async getInvitations(req, res) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 50,
        status,
        invitationType,
        deliveryMethod,
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        status,
        invitationType,
        deliveryMethod,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      const result = await InvitationService.getInvitations(userId, options);

      res.json({
        success: true,
        data: result.invitations,
        pagination: result.pagination,
        message: `Retrieved ${result.invitations.length} invitations`
      });
    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invitations',
        error: error.message
      });
    }
  }

  /**
   * Get single invitation (existing method)
   * GET /api/v1/invitations/:id
   */
  static async getInvitation(req, res) {
    try {
      const userId = req.user.userId;
      const invitationId = req.params.id;

      const invitation = await InvitationService.getInvitation(userId, invitationId);

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      res.json({
        success: true,
        data: invitation,
        message: 'Invitation retrieved successfully'
      });
    } catch (error) {
      console.error('Get invitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invitation',
        error: error.message
      });
    }
  }

  /**
   * Resend invitation (existing method)
   * POST /api/v1/invitations/:id/resend
   */
  static async resendInvitation(req, res) {
    try {
      const userId = req.user.userId;
      const invitationId = req.params.id;
      const { deliveryMethod, newMessage } = req.body;

      const result = await InvitationService.resendInvitation(userId, invitationId, {
        deliveryMethod,
        newMessage
      });

      res.json({
        success: true,
        data: result,
        message: 'Invitation resent successfully'
      });
    } catch (error) {
      console.error('Resend invitation error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Cannot resend')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to resend invitation',
        error: error.message
      });
    }
  }

  /**
   * Accept invitation (existing method - public endpoint)
   * POST /api/v1/invitations/accept/:token
   */
  static async acceptInvitation(req, res) {
    try {
      const inviteToken = req.params.token;
      const acceptanceData = req.body;

      const result = await InvitationService.acceptInvitation(inviteToken, acceptanceData);

      res.json({
        success: true,
        data: result,
        message: 'Invitation accepted successfully'
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to accept invitation',
        error: error.message
      });
    }
  }

  /**
   * Cancel invitation (existing method)
   * DELETE /api/v1/invitations/:id
   */
  static async cancelInvitation(req, res) {
    try {
      const userId = req.user.userId;
      const invitationId = req.params.id;

      const invitation = await InvitationService.getInvitation(userId, invitationId);
      
      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      if (invitation.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel accepted invitation'
        });
      }

      await InvitationService.updateInvitation(invitationId, {
        status: 'cancelled',
        cancelled_at: new Date()
      });

      await InvitationService.logInvitationAction(invitationId, 'cancelled', {
        cancelledBy: userId,
        reason: req.body.reason || 'User cancelled'
      });

      res.json({
        success: true,
        data: { id: invitationId, status: 'cancelled' },
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel invitation',
        error: error.message
      });
    }
  }

  /**
   * Get invitation analytics (enhanced with SMS data)
   * GET /api/v1/invitations/analytics
   */
  static async getInvitationAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const {
        startDate,
        endDate,
        invitationType
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        invitationType
      };

      // Get both regular and enhanced analytics
      const [regularAnalytics, enhancedAnalytics] = await Promise.all([
        InvitationService.getInvitationAnalytics(userId, options),
        enhancedInvitationService.getInvitationAnalytics(userId, options)
      ]);

      res.json({
        success: true,
        data: {
          ...regularAnalytics,
          smsStats: enhancedAnalytics.stats,
          totalClicks: enhancedAnalytics.totalClicks,
          period: enhancedAnalytics.period
        },
        message: 'Invitation analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Get invitation analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invitation analytics',
        error: error.message
      });
    }
  }

  // Keep all other existing methods...
  static async getBulkBatches(req, res) { /* existing implementation */ }
  static async getInvitationHistory(req, res) { /* existing implementation */ }
  static async bulkUpdateStatus(req, res) { /* existing implementation */ }
  static async getDeliveryStatus(req, res) { /* existing implementation */ }
}

module.exports = InvitationController;