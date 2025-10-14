const express = require('express');
const messagingController = require('../controllers/messagingController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(messagingController.listConversations.bind(messagingController)));
router.post('/', asyncHandler(messagingController.createConversation.bind(messagingController)));
router.post('/ensure-direct', asyncHandler(messagingController.ensureDirectConversation.bind(messagingController)));
router.get('/:conversationId', asyncHandler(messagingController.getConversation.bind(messagingController)));
router.get('/:conversationId/messages', asyncHandler(messagingController.getMessages.bind(messagingController)));
router.post('/:conversationId/messages', asyncHandler(messagingController.sendMessage.bind(messagingController)));
router.post('/:conversationId/read', asyncHandler(messagingController.markConversationRead.bind(messagingController)));
router.post('/:conversationId/typing', asyncHandler(messagingController.typingIndicator.bind(messagingController)));

module.exports = router;
