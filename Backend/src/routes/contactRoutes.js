/**
 * Contact Routes for FixRx
 * Handles contact management API routes
 */

const express = require('express');
const ContactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Use the existing rate limiter
const contactRateLimit = rateLimiter;
const importRateLimit = rateLimiter;
const bulkRateLimit = rateLimiter;

// Contact CRUD operations
router.get('/', contactRateLimit, asyncHandler(ContactController.getContacts));
router.get('/stats', contactRateLimit, asyncHandler(ContactController.getContactStats));
router.get('/search/:identifier', contactRateLimit, asyncHandler(ContactController.searchByIdentifier));
router.get('/import-batches', contactRateLimit, asyncHandler(ContactController.getImportBatches));
router.get('/export', contactRateLimit, asyncHandler(ContactController.exportContacts));
router.get('/:id', contactRateLimit, asyncHandler(ContactController.getContact));

router.post('/', contactRateLimit, asyncHandler(ContactController.createContact));
router.post('/bulk', bulkRateLimit, asyncHandler(ContactController.bulkCreateContacts));
router.post('/import', importRateLimit, asyncHandler(ContactController.importContacts));
router.post('/sync', bulkRateLimit, asyncHandler(ContactController.syncContacts));

router.put('/:id', contactRateLimit, asyncHandler(ContactController.updateContact));
router.delete('/:id', contactRateLimit, asyncHandler(ContactController.deleteContact));

module.exports = router;
