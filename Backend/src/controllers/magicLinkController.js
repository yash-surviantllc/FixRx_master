/**
 * Magic Link Authentication Controller for FixRx
 * Handles API endpoints for passwordless authentication
 */

const magicLinkService = require('../services/magicLinkService');
const { logger } = require('../utils/logger');
const Joi = require('joi');

class MagicLinkController {
  /**
   * Send magic link for login/registration
   * POST /api/v1/auth/magic-link/send
   */
  async sendMagicLink(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        email: Joi.string().email().required().messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
        purpose: Joi.string().valid('LOGIN', 'REGISTRATION').default('LOGIN').messages({
          'any.only': 'Purpose must be either LOGIN or REGISTRATION'
        })
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, purpose } = value;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';

      // Send magic link
      const result = await magicLinkService.sendMagicLink(
        email.toLowerCase().trim(),
        purpose,
        userAgent,
        ipAddress
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          code: 'MAGIC_LINK_ERROR'
        });
      }

      logger.info(`Magic link requested`, {
        email: email.toLowerCase().trim(),
        purpose,
        ipAddress,
        userAgent: userAgent.substring(0, 100) // Truncate for logging
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: email.toLowerCase().trim(),
          purpose,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      logger.error('Error in sendMagicLink controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Verify magic link and authenticate user
   * POST /api/v1/auth/magic-link/verify
   */
  async verifyMagicLink(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        token: Joi.string().required().messages({
          'any.required': 'Token is required'
        }),
        email: Joi.string().email().required().messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        })
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { token, email } = value;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';

      // Verify magic link
      const result = await magicLinkService.verifyMagicLink(
        token,
        email.toLowerCase().trim(),
        userAgent,
        ipAddress
      );

      if (!result.success) {
        // Determine appropriate status code based on error type
        let statusCode = 400;
        let errorCode = 'VERIFICATION_ERROR';
        
        if (result.message.includes('expired')) {
          errorCode = 'TOKEN_EXPIRED';
        } else if (result.message.includes('used')) {
          errorCode = 'TOKEN_ALREADY_USED';
        } else if (result.message.includes('Invalid')) {
          errorCode = 'INVALID_TOKEN';
        }
        
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: errorCode,
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`Magic link verified successfully`, {
        userId: result.user.id,
        email: result.user.email,
        isNewUser: result.isNewUser,
        ipAddress
      });

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          token: result.token,
          isNewUser: result.isNewUser,
          expiresIn: 15 * 60 // 15 minutes in seconds
        }
      });

    } catch (error) {
      logger.error('Error in verifyMagicLink controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again.',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get magic link status (for debugging/admin)
   * GET /api/v1/auth/magic-link/status/:token
   */
  async getMagicLinkStatus(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
          success: false,
          message: 'Endpoint not available',
          code: 'NOT_FOUND'
        });
      }

      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
          code: 'VALIDATION_ERROR'
        });
      }

      const magicLink = await magicLinkService.findMagicLink(token);

      if (!magicLink) {
        return res.status(404).json({
          success: false,
          message: 'Magic link not found',
          code: 'NOT_FOUND'
        });
      }

      // Remove sensitive data
      const { token: _, ...safeMagicLink } = magicLink;

      res.status(200).json({
        success: true,
        data: {
          ...safeMagicLink,
          isExpired: new Date() > new Date(magicLink.expires_at),
          timeRemaining: Math.max(0, new Date(magicLink.expires_at) - new Date())
        }
      });

    } catch (error) {
      logger.error('Error in getMagicLinkStatus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Health check for magic link service
   * GET /api/v1/auth/magic-link/health
   */
  async healthCheck(req, res) {
    try {
      const health = await magicLinkService.healthCheck();

      const status = health.overall ? 200 : 503;

      res.status(status).json({
        success: health.overall,
        data: {
          service: 'magic-link',
          status: health.overall ? 'healthy' : 'unhealthy',
          checks: {
            database: health.database ? 'ok' : 'error',
            email: health.email ? 'ok' : 'error'
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in magic link health check:', error);
      res.status(503).json({
        success: false,
        data: {
          service: 'magic-link',
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Cleanup expired magic links (admin endpoint)
   * POST /api/v1/auth/magic-link/cleanup
   */
  async cleanupExpiredLinks(req, res) {
    try {
      // Only allow in development or with admin privileges
      if (process.env.NODE_ENV === 'production') {
        // In production, this should be protected by admin middleware
        // For now, we'll disable it
        return res.status(404).json({
          success: false,
          message: 'Endpoint not available',
          code: 'NOT_FOUND'
        });
      }

      const cleanedCount = await magicLinkService.cleanupExpiredLinks();

      res.status(200).json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired magic links`,
        data: {
          cleanedCount,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error in cleanupExpiredLinks controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new MagicLinkController();
