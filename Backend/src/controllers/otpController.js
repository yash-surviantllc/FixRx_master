const Joi = require('joi');
const otpService = require('../services/otpService');
const { logger } = require('../utils/logger');

class OtpController {
  async sendOtp(req, res) {
    try {
      const schema = Joi.object({
        phone: Joi.string().required().messages({
          'any.required': 'Phone number is required'
        }),
        purpose: Joi.string().valid('LOGIN', 'REGISTRATION').default('LOGIN')
      });

      const { error, value } = schema.validate(req.body || {});
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { phone, purpose } = value;
      const ipAddress = req.ip || req.connection?.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';

      const result = await otpService.sendOtp(phone, purpose, ipAddress, userAgent);

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.code);
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('OTP send error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        code: 'SERVER_ERROR'
      });
    }
  }

  async resendOtp(req, res) {
    return this.sendOtp(req, res);
  }

  async verifyOtp(req, res) {
    try {
      const schema = Joi.object({
        phone: Joi.string().required().messages({
          'any.required': 'Phone number is required'
        }),
        code: Joi.string().required().messages({
          'any.required': 'Verification code is required'
        })
      });

      const { error, value } = schema.validate(req.body || {});
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { phone, code } = value;
      const ipAddress = req.ip || req.connection?.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';

      const result = await otpService.verifyOtp(phone, code, ipAddress, userAgent);

      if (!result.success) {
        const statusCode = this.mapErrorToStatus(result.code);
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('OTP verify error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify code. Please try again.',
        code: 'SERVER_ERROR'
      });
    }
  }

  healthCheck(req, res) {
    return res.json({
      success: true,
      message: 'OTP service healthy',
      data: {
        devMode: process.env.OTP_DEV_MODE === 'true'
      }
    });
  }

  mapErrorToStatus(code) {
    switch (code) {
      case 'INVALID_PHONE':
      case 'INVALID_CODE':
      case 'VERIFICATION_NOT_FOUND':
      case 'OTP_EXPIRED':
        return 400;
      case 'RATE_LIMIT':
      case 'TOO_MANY_ATTEMPTS':
        return 429;
      case 'SERVER_ERROR':
      default:
        return 500;
    }
  }
}

module.exports = new OtpController();
