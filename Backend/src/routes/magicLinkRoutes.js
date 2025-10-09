/**
 * Magic Link Authentication Routes for FixRx
 * Defines API endpoints for passwordless authentication
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const magicLinkController = require('../controllers/magicLinkController');

const router = express.Router();

// Rate limiting for magic link requests
const magicLinkRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many magic link requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests to allow legitimate usage
  skipSuccessfulRequests: false,
  // Custom key generator to rate limit by IP + email combination
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

// Stricter rate limiting for verification attempts
const verificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Allow more verification attempts as users might make mistakes
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
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
router.post('/verify', verificationRateLimit, magicLinkController.verifyMagicLink);

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
