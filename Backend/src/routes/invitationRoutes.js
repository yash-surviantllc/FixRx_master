/**
 * Invitation Routes for FixRx
 * Handles invitation management API routes with bulk operations
 */

const express = require('express');
const InvitationController = require('../controllers/invitationController');
const { verifyToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Use the existing rate limiters
const invitationRateLimit = rateLimiter;
const bulkRateLimit = rateLimiter;
const resendRateLimit = rateLimiter;

// Public routes (no authentication required)
router.post('/accept/:token', asyncHandler(InvitationController.acceptInvitation));

// Protected routes (authentication required)
router.use(verifyToken);

// Individual invitation operations
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
