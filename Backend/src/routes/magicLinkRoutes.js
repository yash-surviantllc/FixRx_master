/**
 * Magic Link Authentication Routes for FixRx
 * Defines API endpoints for passwordless authentication
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const magicLinkController = require('../controllers/magicLinkController');
const { logger } = require('../utils/logger');

const router = express.Router();

// Environment-based rate limiting configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting for magic link requests
const magicLinkRateLimit = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  max: isDevelopment ? 50 : 5, // 50 requests dev, 5 requests prod
  message: {
    success: false,
    message: isDevelopment 
      ? 'Development rate limit exceeded. Please wait 1 minute before trying again.'
      : 'Too many magic link requests. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: isDevelopment ? 60 : 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  },
  handler: (req, res) => {
    console.log(`Rate limit exceeded for magic link send: ${req.ip} - ${req.body?.email}`);
    res.status(429).json({
      success: false,
      message: isDevelopment 
        ? 'Development rate limit exceeded. Please wait 1 minute before trying again.'
        : 'Too many magic link requests. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: isDevelopment ? 60 : 900
    });
  }
});

// Verification rate limiting with development-friendly settings
const verificationRateLimit = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 min dev, 5 min prod
  max: isDevelopment ? 100 : 10, // 100 attempts dev, 10 attempts prod
  message: {
    success: false,
    message: isDevelopment
      ? 'Development verification rate limit exceeded. Please wait 1 minute.'
      : 'Too many verification attempts. Please try again in 5 minutes.',
    code: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
    retryAfter: isDevelopment ? 60 : 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination for more granular control
    const email = req.body?.email || 'unknown';
    return `verify-${req.ip}-${email}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit reached for verification', { ip: req.ip, email: req.body?.email });
    return res.status(429).json({
      success: false,
      error: 'Too many verification attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * @route   POST /api/v1/auth/magic-link/send
 * @desc    Send magic link for login or registration
 * @access  Public
 * @body    { email: string, purpose?: 'LOGIN' | 'REGISTRATION' }
 */
router.post('/send', magicLinkRateLimit, magicLinkController.sendMagicLink);

/**
 * @route   POST /api/v1/auth/magic-link/verify
 * @desc    Verify magic link and authenticate user
 * @access  Public
 * @body    { token: string, email: string }
 */
router.post('/verify', (req, res, next) => {
  console.log('ROUTE: Verification request received', {
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
}, verificationRateLimit, magicLinkController.verifyMagicLink);

/**
 * @route   GET /api/v1/auth/magic-link/health
 * @desc    Health check for magic link service
 * @access  Public
 */
router.get('/health', magicLinkController.healthCheck);

// Development/Admin only endpoints
if (process.env.NODE_ENV !== 'production') {
  /**
   * @route   GET /api/v1/auth/magic-link/status/:token
   * @desc    Get magic link status (development only)
   * @access  Development only
   */
  router.get('/status/:token', magicLinkController.getMagicLinkStatus);

  /**
   * @route   POST /api/v1/auth/magic-link/cleanup
   * @desc    Cleanup expired magic links (development only)
   * @access  Development only
   */
  router.post('/cleanup', magicLinkController.cleanupExpiredLinks);
}

module.exports = router;
