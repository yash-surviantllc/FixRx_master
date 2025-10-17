/**
 * Enhanced Invitation Routes for FixRx
 * Handles invitation management API routes with bulk operations, SMS invitations, and contact management
 */

const express = require('express');
const InvitationController = require('../controllers/invitationController');
const { verifyToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Enhanced rate limiters for different operations
const invitationRateLimit = rateLimiter;
const bulkRateLimit = rateLimiter;
const resendRateLimit = rateLimiter;
const smsInvitationRateLimit = rateLimiter;
const contactImportRateLimit = rateLimiter;

// =============================================
// PUBLIC ROUTES (no authentication required)
// =============================================

/**
 * Accept invitation (existing - public endpoint)
 */
router.post('/accept/:token', asyncHandler(InvitationController.acceptInvitation));

/**
 * Track invitation click from referral code
 */
router.post('/track-click', asyncHandler(InvitationController.trackClick));

// =============================================
// PROTECTED ROUTES (authentication required)
// =============================================

// Apply authentication middleware to all routes below
router.use(verifyToken);

// =============================================
// NEW SMS INVITATION ROUTES
// =============================================

/**
 * Send friend invitation via SMS
 */
router.post('/friend-sms', 
  smsInvitationRateLimit, 
  asyncHandler(InvitationController.sendFriendSMS)
);

/**
 * Send contractor invitation via SMS
 */
router.post('/contractor-sms', 
  smsInvitationRateLimit, 
  asyncHandler(InvitationController.sendContractorSMS)
);

/**
 * Get user's referral code
 */
router.get('/referral-code', 
  invitationRateLimit, 
  asyncHandler(InvitationController.getReferralCode)
);

// =============================================
// CONTACT MANAGEMENT ROUTES
// =============================================

/**
 * Import contacts from CSV, JSON, or phone contacts
 */
router.post('/contacts/import', 
  contactImportRateLimit, 
  asyncHandler(InvitationController.importContacts)
);

/**
 * Get user's contacts
 */
router.get('/contacts', 
  invitationRateLimit, 
  asyncHandler(InvitationController.getContacts)
);

/**
 * Send invitations to selected contacts
 */
router.post('/contacts/invite', 
  invitationRateLimit, 
  asyncHandler(InvitationController.inviteContacts)
);

// =============================================
// EXISTING ROUTES (preserved as-is)
// =============================================

/**
 * Individual invitation operations
 */
router.get('/', invitationRateLimit, asyncHandler(InvitationController.getInvitations));
router.get('/analytics', invitationRateLimit, asyncHandler(InvitationController.getInvitationAnalytics));
router.get('/batches', invitationRateLimit, asyncHandler(InvitationController.getBulkBatches));
router.get('/:id', invitationRateLimit, asyncHandler(InvitationController.getInvitation));
router.get('/:id/history', invitationRateLimit, asyncHandler(InvitationController.getInvitationHistory));
router.get('/:id/delivery-status', invitationRateLimit, asyncHandler(InvitationController.getDeliveryStatus));

router.post('/', invitationRateLimit, asyncHandler(InvitationController.createInvitation));
router.post('/bulk', bulkRateLimit, asyncHandler(InvitationController.createBulkInvitations));
router.post('/:id/resend', resendRateLimit, asyncHandler(InvitationController.resendInvitation));

router.put('/bulk/status', bulkRateLimit, asyncHandler(InvitationController.bulkUpdateStatus));
router.delete('/:id', invitationRateLimit, asyncHandler(InvitationController.cancelInvitation));

module.exports = router;
