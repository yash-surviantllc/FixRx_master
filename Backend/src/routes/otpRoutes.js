const express = require('express');
const rateLimit = require('express-rate-limit');
const otpController = require('../controllers/otpController');

const router = express.Router();

const isDevelopment = process.env.NODE_ENV === 'development';

const sendRateLimit = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before trying again.',
    code: 'RATE_LIMIT'
  },
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    return `${req.ip}-${phone}`;
  }
});

const verifyRateLimit = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  max: isDevelopment ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
    code: 'TOO_MANY_ATTEMPTS'
  },
  keyGenerator: (req) => {
    const phone = req.body?.phone || 'unknown';
    return `${req.ip}-${phone}`;
  }
});

router.post('/send', sendRateLimit, otpController.sendOtp.bind(otpController));
router.post('/resend', sendRateLimit, otpController.resendOtp.bind(otpController));
router.post('/verify', verifyRateLimit, otpController.verifyOtp.bind(otpController));
router.get('/health', otpController.healthCheck.bind(otpController));

module.exports = router;
