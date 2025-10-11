const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { dbManager } = require('../config/database');
const twilioService = require('./twilioService');
const magicLinkService = require('./magicLinkService');
const { logger } = require('../utils/logger');

const OTP_LENGTH = parseInt(process.env.OTP_CODE_LENGTH || '6', 10);
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_BLOCK_DURATION_MINUTES = parseInt(process.env.OTP_BLOCK_DURATION_MINUTES || '15', 10);
const OTP_SESSION_EXPIRY_DAYS = parseInt(process.env.OTP_SESSION_EXPIRY_DAYS || '7', 10);
const OTP_PURPOSES = ['LOGIN', 'REGISTRATION'];

const OTP_DEV_MODE = process.env.OTP_DEV_MODE === 'true';
const OTP_DEV_CODE = process.env.OTP_DEV_CODE || '123456';

class OtpService {
  /**
   * Send OTP code to phone number
   */
  async sendOtp(rawPhone, purpose = 'LOGIN', ipAddress = '', userAgent = '') {
    try {
      const normalizedPurpose = OTP_PURPOSES.includes(purpose) ? purpose : 'LOGIN';
      const phoneNumber = this.formatPhoneNumber(rawPhone);

      if (!phoneNumber) {
        return {
          success: false,
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        };
      }

      const now = new Date();

      const userRecord = await this.findUserByPhone(phoneNumber);
      const blockStatus = this.checkUserBlock(userRecord, now);
      if (!blockStatus.allowed) {
        return {
          success: false,
          message: blockStatus.message,
          code: 'TOO_MANY_ATTEMPTS',
          retryAfterSeconds: blockStatus.retryAfterSeconds
        };
      }

      const resendCheck = await this.checkResendCooldown(phoneNumber, now);
      if (!resendCheck.allowed) {
        return {
          success: false,
          message: `Please wait ${resendCheck.retryAfterSeconds} seconds before requesting another code`,
          code: 'RATE_LIMIT',
          retryAfterSeconds: resendCheck.retryAfterSeconds
        };
      }

      const activeQuota = await this.checkHourlyQuota(phoneNumber, now);
      if (!activeQuota.allowed) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.',
          code: 'RATE_LIMIT'
        };
      }

      const otpCode = this.generateOtpCode();
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedCode = this.hashOtpCode(otpCode, salt);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const verificationId = await this.storeOtpVerification({
        phoneNumber,
        hashedCode,
        salt,
        purpose: normalizedPurpose,
        ipAddress,
        userAgent,
        expiresAt
      });

      let deliveryMethod = 'mock';
      if (twilioService.isAvailable() && !OTP_DEV_MODE) {
        try {
          const smsResult = await twilioService.sendVerificationCode({
            to: phoneNumber,
            code: otpCode,
            purpose: normalizedPurpose
          });

          if (smsResult?.success) {
            deliveryMethod = 'twilio';
          } else {
            logger.warn('Twilio sendVerificationCode returned non-success result. Using fallback.', {
              phoneNumber,
              purpose: normalizedPurpose
            });
          }
        } catch (error) {
          logger.error('Failed to send OTP via Twilio. Falling back to dev code.', error);
        }
      }

      await this.updateUserOtpMetadata(phoneNumber, {
        lastOtpSentAt: now,
        otpAttempts: 0,
        otpBlockedUntil: null,
        otpLastIp: ipAddress,
        otpLastUserAgent: userAgent
      });

      const response = {
        success: true,
        message: deliveryMethod === 'twilio'
          ? 'Verification code sent to your phone'
          : 'Verification code generated (development mode)',
        data: {
          phone: phoneNumber,
          expiresIn: OTP_EXPIRY_MINUTES * 60,
          deliveryMethod,
          otpVerificationId: verificationId
        }
      };

      if (deliveryMethod !== 'twilio') {
        response.data.devCode = otpCode;
      }

      logger.info('OTP code generated', {
        phoneNumber,
        deliveryMethod,
        purpose: normalizedPurpose
      });

      return response;
    } catch (error) {
      logger.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
        code: 'SERVER_ERROR'
      };
    }
  }

  /**
   * Resend OTP code (uses same logic as send)
   */
  async resendOtp(rawPhone, purpose = 'LOGIN', ipAddress = '', userAgent = '') {
    return this.sendOtp(rawPhone, purpose, ipAddress, userAgent);
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(rawPhone, code, ipAddress = '', userAgent = '') {
    try {
      const phoneNumber = this.formatPhoneNumber(rawPhone);

      if (!phoneNumber) {
        return {
          success: false,
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        };
      }

      const verification = await this.findActiveVerification(phoneNumber);
      if (!verification) {
        return {
          success: false,
          message: 'No active verification found. Please request a new code.',
          code: 'VERIFICATION_NOT_FOUND'
        };
      }

      const now = new Date();
      if (new Date(verification.expires_at) < now) {
        await this.markVerificationExpired(verification.id);
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
          code: 'OTP_EXPIRED'
        };
      }

      const hashedInput = this.hashOtpCode(code, verification.otp_code_salt);
      if (hashedInput !== verification.otp_code_hash) {
        const attemptsResult = await this.incrementVerificationAttempts(verification);
        return {
          success: false,
          message: attemptsResult.blocked
            ? 'Too many incorrect attempts. Please try again later.'
            : 'Invalid verification code. Please try again.',
          code: attemptsResult.blocked ? 'TOO_MANY_ATTEMPTS' : 'INVALID_CODE',
          retryAfterSeconds: attemptsResult.retryAfterSeconds
        };
      }

      await this.markVerificationVerified(verification.id);

      const userResult = await this.findOrCreateUserByPhone(phoneNumber, {
        ipAddress,
        userAgent,
        purpose: verification.purpose
      });

      const sessionToken = await this.createPhoneAuthSession({
        phoneNumber,
        userId: userResult.user.id,
        verificationId: verification.id,
        ipAddress,
        userAgent
      });

      const accessToken = this.generateAccessToken(userResult.user);
      const refreshToken = this.generateRefreshToken(userResult.user.id);
      await this.storeRefreshToken(userResult.user.id, refreshToken);

      const safeUser = this.toSafeUser(userResult.user);

      logger.info('OTP verification successful', {
        phoneNumber,
        userId: userResult.user.id,
        isNewUser: userResult.isNewUser,
        purpose: verification.purpose
      });

      return {
        success: true,
        message: 'Phone number verified successfully',
        data: {
          user: safeUser,
          token: accessToken,
          refreshToken,
          sessionToken,
          isNewUser: userResult.isNewUser
        }
      };
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify code. Please try again.',
        code: 'SERVER_ERROR'
      };
    }
  }

  /**
   * Utility & persistence helpers
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    let digits = `${phone}`.trim();

    // Remove spaces and hyphen characters
    digits = digits.replace(/[\s\-().]/g, '');

    if (!digits.startsWith('+')) {
      // Default to US country code if missing
      if (digits.length === 10) {
        digits = `+1${digits}`;
      } else {
        digits = `+${digits.replace(/^\+/, '')}`;
      }
    }

    const internationalRegex = /^\+[1-9]\d{6,14}$/;
    if (!internationalRegex.test(digits)) {
      return null;
    }

    return digits;
  }

  generateOtpCode() {
    const max = 10 ** OTP_LENGTH;
    const code = crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
    return OTP_DEV_MODE ? OTP_DEV_CODE.padStart(OTP_LENGTH, '0') : code;
  }

  hashOtpCode(code, salt) {
    return crypto
      .createHmac('sha256', salt)
      .update(code)
      .digest('hex');
  }

  async checkResendCooldown(phoneNumber, now) {
    const cooldownResult = await dbManager.query(
      `SELECT last_sent_at
         FROM otp_verifications
        WHERE phone_number = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [phoneNumber]
    );

    if (!cooldownResult.rows.length) {
      return { allowed: true };
    }

    const lastSentAt = cooldownResult.rows[0].last_sent_at;
    if (!lastSentAt) {
      return { allowed: true };
    }

    const diffSeconds = Math.floor((now.getTime() - new Date(lastSentAt).getTime()) / 1000);
    if (diffSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      return {
        allowed: false,
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS - diffSeconds
      };
    }

    return { allowed: true };
  }

  async checkHourlyQuota(phoneNumber, now) {
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    const quotaResult = await dbManager.query(
      `SELECT COUNT(*)::int AS count
         FROM otp_verifications
        WHERE phone_number = $1
          AND created_at >= $2`,
      [phoneNumber, windowStart]
    );

    const count = quotaResult.rows[0]?.count || 0;
    const limit = parseInt(process.env.OTP_MAX_PER_HOUR || '5', 10);

    if (count >= limit) {
      return { allowed: false };
    }

    return { allowed: true };
  }

  checkUserBlock(userRecord, now) {
    if (!userRecord) {
      return { allowed: true };
    }

    if (userRecord.otp_blocked_until && new Date(userRecord.otp_blocked_until) > now) {
      const retryAfterSeconds = Math.ceil(
        (new Date(userRecord.otp_blocked_until).getTime() - now.getTime()) / 1000
      );
      return {
        allowed: false,
        message: 'Too many attempts. Please try again later.',
        retryAfterSeconds
      };
    }

    return { allowed: true };
  }

  async storeOtpVerification({
    phoneNumber,
    hashedCode,
    salt,
    purpose,
    ipAddress,
    userAgent,
    expiresAt
  }) {
    const insertQuery = `
      INSERT INTO otp_verifications (
        phone_number,
        otp_code_hash,
        otp_code_salt,
        purpose,
        status,
        attempts,
        max_attempts,
        expires_at,
        last_sent_at,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, 'PENDING', 0, $5, $6, NOW(), $7, $8)
      RETURNING id
    `;

    const result = await dbManager.query(insertQuery, [
      phoneNumber,
      hashedCode,
      salt,
      purpose,
      OTP_MAX_ATTEMPTS,
      expiresAt,
      ipAddress,
      userAgent
    ]);

    return result.rows[0].id;
  }

  async findActiveVerification(phoneNumber) {
    const result = await dbManager.query(
      `SELECT *
         FROM otp_verifications
        WHERE phone_number = $1
          AND status = 'PENDING'
        ORDER BY created_at DESC
        LIMIT 1`,
      [phoneNumber]
    );

    return result.rows[0] || null;
  }

  async markVerificationExpired(verificationId) {
    await dbManager.query(
      `UPDATE otp_verifications
          SET status = 'EXPIRED',
              updated_at = NOW()
        WHERE id = $1`,
      [verificationId]
    );
  }

  async incrementVerificationAttempts(verification) {
    const updated = await dbManager.query(
      `UPDATE otp_verifications
          SET attempts = attempts + 1,
              updated_at = NOW()
        WHERE id = $1
        RETURNING attempts, max_attempts, phone_number`,
      [verification.id]
    );

    const newAttempts = updated.rows[0].attempts;
    const maxAttempts = updated.rows[0].max_attempts;

    if (newAttempts >= maxAttempts) {
      await dbManager.query(
        `UPDATE otp_verifications
            SET status = 'FAILED'
          WHERE id = $1`,
        [verification.id]
      );

      await this.blockUserForFailures(updated.rows[0].phone_number);

      return {
        blocked: true,
        retryAfterSeconds: OTP_BLOCK_DURATION_MINUTES * 60
      };
    }

    return {
      blocked: false
    };
  }

  async markVerificationVerified(verificationId) {
    await dbManager.query(
      `UPDATE otp_verifications
          SET status = 'VERIFIED',
              verified_at = NOW(),
              updated_at = NOW()
        WHERE id = $1`,
      [verificationId]
    );
  }

  async blockUserForFailures(phoneNumber) {
    const blockUntil = new Date(Date.now() + OTP_BLOCK_DURATION_MINUTES * 60 * 1000);
    await dbManager.query(
      `UPDATE users
          SET otp_blocked_until = $1,
              otp_attempts = otp_attempts + 1
        WHERE phone = $2`,
      [blockUntil, phoneNumber]
    );
  }

  async updateUserOtpMetadata(phoneNumber, {
    lastOtpSentAt = null,
    otpAttempts = null,
    otpBlockedUntil = null,
    otpLastIp = null,
    otpLastUserAgent = null
  }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (lastOtpSentAt) {
      fields.push(`last_otp_sent_at = $${idx++}`);
      values.push(lastOtpSentAt);
    }

    if (otpAttempts !== null && otpAttempts !== undefined) {
      fields.push(`otp_attempts = $${idx++}`);
      values.push(otpAttempts);
    }

    if (otpBlockedUntil !== null) {
      fields.push(`otp_blocked_until = $${idx++}`);
      values.push(otpBlockedUntil);
    }

    if (otpLastIp !== null) {
      fields.push(`otp_last_ip = $${idx++}`);
      values.push(otpLastIp);
    }

    if (otpLastUserAgent !== null) {
      fields.push(`otp_last_user_agent = $${idx++}`);
      values.push(otpLastUserAgent);
    }

    if (!fields.length) {
      return;
    }

    values.push(phoneNumber);

    const query = `
      UPDATE users
         SET ${fields.join(', ')},
             updated_at = NOW()
       WHERE phone = $${idx}
    `;

    await dbManager.query(query, values);
  }

  async findUserByPhone(phoneNumber) {
    const result = await dbManager.query(
      `SELECT *
         FROM users
        WHERE phone = $1
        LIMIT 1`,
      [phoneNumber]
    );

    return result.rows[0] || null;
  }

  async findOrCreateUserByPhone(phoneNumber, { ipAddress, userAgent, purpose }) {
    let user = await this.findUserByPhone(phoneNumber);
    let isNewUser = false;

    if (!user) {
      user = await this.createUserFromPhone(phoneNumber, purpose);
      isNewUser = true;
    }

    await dbManager.query(
      `UPDATE users
          SET phone = $1,
              phone_verified = TRUE,
              phone_verified_at = NOW(),
              otp_verified = TRUE,
              last_login_at = NOW(),
              otp_last_ip = $2,
              otp_last_user_agent = $3,
              updated_at = NOW()
        WHERE id = $4`,
      [phoneNumber, ipAddress, userAgent, user.id]
    );

    const refreshedUser = await this.findUserById(user.id);

    return {
      user: refreshedUser,
      isNewUser
    };
  }

  async createUserFromPhone(phoneNumber, purpose) {
    const sanitizedPhone = phoneNumber.replace(/[^\d]/g, '');
    let generatedEmail = `${sanitizedPhone}@fixrx.app`;

    const emailCheck = await dbManager.query(
      `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
      [generatedEmail]
    );

    if (emailCheck.rows.length) {
      generatedEmail = `${sanitizedPhone}-${uuidv4().slice(0, 6)}@fixrx.app`;
    }

    const randomPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const result = await dbManager.query(
      `INSERT INTO users (
          email,
          password_hash,
          first_name,
          last_name,
          user_type,
          phone,
          email_verified,
          phone_verified,
          phone_verified_at,
          otp_verified,
          status,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          FALSE, TRUE, NOW(), TRUE,
          'active', NOW(), NOW()
        )
        RETURNING *`,
      [
        generatedEmail,
        passwordHash,
        'New',
        'User',
        'consumer',
        phoneNumber
      ]
    );

    return result.rows[0];
  }

  async findUserById(userId) {
    const result = await dbManager.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    return result.rows[0];
  }

  async createPhoneAuthSession({
    phoneNumber,
    userId,
    verificationId,
    ipAddress,
    userAgent
  }) {
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + OTP_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await dbManager.query(
      `INSERT INTO phone_auth_sessions (
          phone_number,
          session_token,
          user_id,
          otp_verification_id,
          expires_at,
          ip_address,
          user_agent,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [phoneNumber, sessionToken, userId, verificationId, expiresAt, ipAddress, userAgent]
    );

    return sessionToken;
  }

  generateAccessToken(user) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
        phone: user.phone
      },
      secret,
      {
        expiresIn: process.env.OTP_ACCESS_TOKEN_TTL || '15m'
      }
    );
  }

  generateRefreshToken(userId) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(
      {
        userId,
        type: 'refresh'
      },
      refreshSecret,
      {
        expiresIn: process.env.OTP_REFRESH_TOKEN_TTL || '7d'
      }
    );
  }

  async storeRefreshToken(userId, refreshToken) {
    try {
      await magicLinkService.storeRefreshToken(userId, refreshToken);
    } catch (error) {
      logger.warn('Failed to store refresh token in user_sessions', { userId, error: error.message });
    }
  }

  toSafeUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      phoneVerifiedAt: user.phone_verified_at,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

module.exports = new OtpService();
