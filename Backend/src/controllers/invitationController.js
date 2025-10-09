/**
 * Invitation Controller for FixRx
 * Handles invitation management with bulk operations and contact integration
 */

const InvitationService = require('../services/invitationService');

class InvitationController {
  /**
   * Create single invitation
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

      const invitation = await InvitationService.createInvitation(userId, invitationData);

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
   * Create bulk invitations
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
   * Get invitations with filtering
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
   * Get single invitation
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
   * Resend invitation
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
   * Accept invitation (public endpoint)
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
   * Cancel invitation
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
   * Get invitation analytics
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

      const analytics = await InvitationService.getInvitationAnalytics(userId, options);

      res.json({
        success: true,
        data: analytics,
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

  /**
   * Get bulk invitation batches
   * GET /api/v1/invitations/batches
   */
  static async getBulkBatches(req, res) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        status
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        status
      };

      const batches = await InvitationService.getBulkBatches(userId, options);

      res.json({
        success: true,
        data: batches,
        message: `Retrieved ${batches.length} bulk batches`
      });
    } catch (error) {
      console.error('Get bulk batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bulk batches',
        error: error.message
      });
    }
  }

  /**
   * Get invitation history/logs
   * GET /api/v1/invitations/:id/history
   */
  static async getInvitationHistory(req, res) {
    try {
      const userId = req.user.userId;
      const invitationId = req.params.id;

      // Verify user has access to this invitation
      const invitation = await InvitationService.getInvitation(userId, invitationId);
      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      const history = await InvitationService.getInvitationHistory(invitationId);

      res.json({
        success: true,
        data: history,
        message: 'Invitation history retrieved successfully'
      });
    } catch (error) {
      console.error('Get invitation history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invitation history',
        error: error.message
      });
    }
  }

  /**
   * Update invitation status (bulk operation)
   * PUT /api/v1/invitations/bulk/status
   */
  static async bulkUpdateStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { invitationIds, status, reason } = req.body;

      if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invitation IDs array is required'
        });
      }

      if (!['cancelled', 'expired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Only cancelled or expired are allowed'
        });
      }

      const results = await InvitationService.bulkUpdateStatus(userId, invitationIds, status, reason);

      res.json({
        success: true,
        data: results,
        message: `Bulk status update completed: ${results.updated} updated, ${results.failed} failed`
      });
    } catch (error) {
      console.error('Bulk update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invitation status',
        error: error.message
      });
    }
  }

  /**
   * Get invitation delivery status
   * GET /api/v1/invitations/:id/delivery-status
   */
  static async getDeliveryStatus(req, res) {
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

      // Get updated delivery status from SMS/Email services
      const deliveryStatus = await InvitationService.getDeliveryStatus(invitationId);

      res.json({
        success: true,
        data: deliveryStatus,
        message: 'Delivery status retrieved successfully'
      });
    } catch (error) {
      console.error('Get delivery status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve delivery status',
        error: error.message
      });
    }
  }
}

module.exports = InvitationController;
