/**
 * Invitation Routes for FixRx
 * Handles invitation management API routes with bulk operations
 */

const express = require('express');
const InvitationController = require('../controllers/invitationController');
const { verifyToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Rate limiting configurations
const invitationRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: 'Too many invitation requests, please try again later'
});

const bulkRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit bulk operations to 10 per hour
  message: 'Too many bulk invitation requests, please try again later'
});

const resendRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit resends
  message: 'Too many resend requests, please try again later'
});

// Public routes (no authentication required)
router.post('/accept/:token', InvitationController.acceptInvitation);

// Protected routes (authentication required)
router.use(verifyToken);

// Individual invitation operations
router.get('/', invitationRateLimit, InvitationController.getInvitations);
router.get('/analytics', invitationRateLimit, InvitationController.getInvitationAnalytics);
router.get('/batches', invitationRateLimit, InvitationController.getBulkBatches);
router.get('/:id', invitationRateLimit, InvitationController.getInvitation);
router.get('/:id/history', invitationRateLimit, InvitationController.getInvitationHistory);
router.get('/:id/delivery-status', invitationRateLimit, InvitationController.getDeliveryStatus);

router.post('/', invitationRateLimit, InvitationController.createInvitation);
router.post('/bulk', bulkRateLimit, InvitationController.createBulkInvitations);
router.post('/:id/resend', resendRateLimit, InvitationController.resendInvitation);

router.put('/bulk/status', bulkRateLimit, InvitationController.bulkUpdateStatus);
router.delete('/:id', invitationRateLimit, InvitationController.cancelInvitation);

module.exports = router;
