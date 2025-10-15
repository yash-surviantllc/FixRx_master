const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

// Simple validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Rate limiting configuration
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many payment attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation schemas
const createPaymentIntentSchema = [
  body('amount').isInt({ min: 100 }).withMessage('Amount must be at least 100'),
  body('serviceRequestId').isUUID().withMessage('Invalid service request ID'),
  body('vendorId').isUUID().withMessage('Invalid vendor ID'),
];

const confirmPaymentSchema = [
  body('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required'),
  body('serviceRequestId').isUUID().withMessage('Invalid service request ID'),
];

const getPaymentSchema = [
  param('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required'),
];

// Routes
// 1. Create payment intent
router.post(
  '/create-intent',
  authenticateToken,
  paymentLimiter,
  (req, res, next) => {
    body('amount').isInt({ min: 100 }).withMessage('Amount must be at least 100')(req, res, () => {
      body('serviceRequestId').isUUID().withMessage('Invalid service request ID')(req, res, () => {
        body('vendorId').isUUID().withMessage('Invalid vendor ID')(req, res, () => {
          validate(req, res, next);
        });
      });
    });
  },
  paymentController.createPaymentIntent
);

// 2. Confirm payment
router.post(
  '/confirm',
  authenticateToken,
  paymentLimiter,
  (req, res, next) => {
    body('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required')(req, res, () => {
      body('serviceRequestId').isUUID().withMessage('Invalid service request ID')(req, res, () => {
        validate(req, res, next);
      });
    });
  },
  paymentController.confirmPayment
);

// 3. Get Stripe config (must come before :paymentIntentId route)
router.get(
  '/config',
  authenticateToken,
  paymentController.getConfig
);

// 4. Webhook endpoint (no authentication needed, uses Stripe signature)
router.post(
  '/webhook',
  // Raw body parser for webhook verification
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

// 5. Get payment by ID (must be last to avoid conflicts)
router.get(
  '/:paymentIntentId',
  authenticateToken,
  (req, res, next) => {
    param('paymentIntentId').isString().notEmpty().withMessage('Payment intent ID is required')(req, res, () => {
      validate(req, res, next);
    });
  },
  paymentController.getPayment
);

module.exports = router;
