/**
 * Contact Routes for FixRx
 * Handles contact management API routes
 */

const express = require('express');
const ContactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply rate limiting
const contactRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  message: 'Too many contact requests, please try again later'
});

const importRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit imports to 10 per hour
  message: 'Too many import requests, please try again later'
});

const bulkRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit bulk operations
  message: 'Too many bulk requests, please try again later'
});

// Contact CRUD operations
router.get('/', contactRateLimit, ContactController.getContacts);
router.get('/stats', contactRateLimit, ContactController.getContactStats);
router.get('/search/:identifier', contactRateLimit, ContactController.searchByIdentifier);
router.get('/import-batches', contactRateLimit, ContactController.getImportBatches);
router.get('/export', contactRateLimit, ContactController.exportContacts);
router.get('/:id', contactRateLimit, ContactController.getContact);

router.post('/', contactRateLimit, ContactController.createContact);
router.post('/bulk', bulkRateLimit, ContactController.bulkCreateContacts);
router.post('/import', importRateLimit, ContactController.importContacts);
router.post('/sync', bulkRateLimit, ContactController.syncContacts);

router.put('/:id', contactRateLimit, ContactController.updateContact);
router.delete('/:id', contactRateLimit, ContactController.deleteContact);

module.exports = router;
