/**
 * Enhanced Authentication Routes for FixRx
 * Comprehensive user management and security endpoints
 */

import express from 'express';
import { body, param } from 'express-validator';
import { enhancedAuthController, loginLimiter, registrationLimiter, passwordResetLimiter } from '../controllers/enhancedAuthController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('userType')
    .isIn(['CONSUMER', 'VENDOR'])
    .withMessage('User type must be CONSUMER or VENDOR'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('metroArea')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Metro area must be less than 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const oauthValidation = [
  body('provider')
    .isIn(['google', 'facebook', 'oauth'])
    .withMessage('Valid OAuth provider is required'),
  body('providerId')
    .notEmpty()
    .withMessage('Provider ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name is required')
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const resetPasswordValidation = [
  param('token')
    .isLength({ min: 32 })
    .withMessage('Valid reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
];

const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('metroArea')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Metro area must be less than 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
];

const securitySettingsValidation = [
  body('enable2FA')
    .optional()
    .isBoolean()
    .withMessage('enable2FA must be a boolean'),
  body('passwordChangeRequired')
    .optional()
    .isBoolean()
    .withMessage('passwordChangeRequired must be a boolean'),
  body('sessionTimeout')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('sessionTimeout must be between 5 and 120 minutes'),
  body('loginNotifications')
    .optional()
    .isBoolean()
    .withMessage('loginNotifications must be a boolean')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
];

const verify2FAValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 6-digit code is required')
];

// Public Routes (No Authentication Required)

/**
 * @route   POST /api/v1/auth/enhanced/register
 * @desc    Register a new user with enhanced security
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/register', 
  registrationLimiter,
  registerValidation,
  enhancedAuthController.register
);

/**
 * @route   POST /api/v1/auth/enhanced/login
 * @desc    Login user with enhanced security
 * @access  Public
 * @rateLimit 5 requests per 15 minutes per IP
 */
router.post('/login',
  loginLimiter,
  loginValidation,
  enhancedAuthController.login
);

/**
 * @route   POST /api/v1/auth/enhanced/oauth
 * @desc    OAuth login/registration (Google, Facebook, etc.)
 * @access  Public
 */
router.post('/oauth',
  oauthValidation,
  enhancedAuthController.oauthLogin
);

/**
 * @route   GET /api/v1/auth/enhanced/verify/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify/:token',
  param('token').isLength({ min: 32 }).withMessage('Valid verification token is required'),
  enhancedAuthController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/enhanced/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/resend-verification',
  passwordResetLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  enhancedAuthController.resendVerification
);

/**
 * @route   POST /api/v1/auth/enhanced/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/forgot-password',
  passwordResetLimiter,
  passwordResetValidation,
  enhancedAuthController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/enhanced/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token',
  resetPasswordValidation,
  enhancedAuthController.resetPassword
);

/**
 * @route   POST /api/v1/auth/enhanced/verify-2fa
 * @desc    Verify 2FA code during login
 * @access  Public
 */
router.post('/verify-2fa',
  verify2FAValidation,
  enhancedAuthController.verify2FA
);

/**
 * @route   POST /api/v1/auth/enhanced/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh',
  enhancedAuthController.refreshToken
);

// Protected Routes (Authentication Required)

/**
 * @route   GET /api/v1/auth/enhanced/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
  authenticateToken,
  enhancedAuthController.getProfile
);

/**
 * @route   PUT /api/v1/auth/enhanced/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  profileUpdateValidation,
  enhancedAuthController.updateProfile
);

/**
 * @route   POST /api/v1/auth/enhanced/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  changePasswordValidation,
  enhancedAuthController.changePassword
);

/**
 * @route   GET /api/v1/auth/enhanced/security-settings
 * @desc    Get user security settings
 * @access  Private
 */
router.get('/security-settings',
  authenticateToken,
  enhancedAuthController.getSecuritySettings
);

/**
 * @route   PUT /api/v1/auth/enhanced/security-settings
 * @desc    Update user security settings
 * @access  Private
 */
router.put('/security-settings',
  authenticateToken,
  securitySettingsValidation,
  enhancedAuthController.updateSecuritySettings
);

/**
 * @route   POST /api/v1/auth/enhanced/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  enhancedAuthController.logout
);

// Health check for enhanced auth system
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enhanced authentication system is healthy',
    timestamp: new Date().toISOString(),
    features: {
      registration: 'active',
      login: 'active',
      oauth: 'active',
      emailVerification: 'active',
      passwordReset: 'active',
      twoFactorAuth: 'active',
      profileManagement: 'active',
      securitySettings: 'active',
      rateLimiting: 'active'
    }
  });
});

export default router;
