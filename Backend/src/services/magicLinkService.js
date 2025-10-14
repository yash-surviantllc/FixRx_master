/**
 * Magic Link Authentication Service for FixRx
 * Implements passwordless authentication via email magic links
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const EmailService = require('./email.service');
const { dbManager } = require('../config/database');
const { logger } = require('../utils/logger');

// EmailService will be instantiated as needed

class MagicLinkService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
    this.BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
    this.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  /**
   * Send magic link for login/registration
   */
  async sendMagicLink(email, purpose = 'LOGIN', userAgent = '', ipAddress = '') {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Rate limiting check
      const rateLimitCheck = await this.checkRateLimit(email);
      if (rateLimitCheck.devBypass) {
        logger.debug('Magic link rate limit bypassed in development', { email });
      }

      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          message: `Too many requests. Please try again in ${rateLimitCheck.waitTime} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          metadata: {
            attemptsInWindow: rateLimitCheck.count,
            windowMinutes: rateLimitCheck.windowMinutes
          }
        };
      }

      // Check if user exists
      const existingUser = await this.findUserByEmail(email);
      
      // For LOGIN purpose, user must exist
      if (purpose === 'LOGIN' && !existingUser) {
        return {
          success: false,
          message: 'No account found with this email address'
        };
      }

      // For REGISTRATION purpose, user must not exist
      if (purpose === 'REGISTRATION' && existingUser) {
        return {
          success: false,
          message: 'An account already exists with this email address'
        };
      }

      // Generate secure token
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.MAGIC_LINK_EXPIRY);

      // Store magic link in database
      const magicLinkId = await this.storeMagicLink({
        email,
        token,
        userId: existingUser?.id || null,
        purpose,
        ipAddress,
        userAgent,
        expiresAt
      });
      
      const webRedirectUrl = `${this.API_BASE_URL.replace('/api/v1', '')}/magic-link?token=${token}&email=${encodeURIComponent(email)}`;
      const directDeepLink = `fixrx://magic-link?token=${token}&email=${encodeURIComponent(email)}`;

      const emailResult = await this.sendMagicLinkEmail(email, webRedirectUrl, purpose, existingUser?.first_name, directDeepLink);

      if (!emailResult.success) {
        // Clean up stored magic link if email failed
        await this.invalidateMagicLink(token);
        return {
          success: false,
          message: 'Failed to send magic link email'
        };
      }

      logger.info(`Magic link sent successfully`, {
        email,
        purpose,
        magicLinkId,
        expiresAt
      });

      return {
        success: true,
        message: 'Magic link sent to your email address',
        expiresIn: this.MAGIC_LINK_EXPIRY / 1000 // seconds
      };

    } catch (error) {
      logger.error('Error sending magic link:', error);
      return {
        success: false,
        message: 'Failed to send magic link. Please try again.'
      };
    }
  }

  /**
   * Verify magic link and authenticate user
   */
  async verifyMagicLink(token, email, userAgent = '', ipAddress = '') {
    try {
      logger.info('Magic link verification attempt', { token: token.substring(0, 10) + '...', email });
      
      const magicLink = await this.findMagicLink(token);

      if (!magicLink) {
        logger.error('Magic link not found in database', { token: token.substring(0, 10) + '...', email });
        return {
          success: false,
          message: 'Invalid or expired magic link'
        };
      }

      if (magicLink.is_used) {
        return {
          success: false,
          message: 'This magic link has already been used'
        };
      }

      const now = new Date();
      const expiresAt = new Date(magicLink.expires_at);

      if (now > expiresAt) {
        await this.invalidateMagicLink(token);
        return {
          success: false,
          message: 'Magic link has expired'
        };
      }

      if (magicLink.email.toLowerCase() !== email.toLowerCase()) {
        return {
          success: false,
          message: 'Invalid magic link'
        };
      }

      let user = null;
      let isNewUser = false;

      if (magicLink.purpose === 'REGISTRATION' || !magicLink.user_id) {
        user = await this.createUserFromMagicLink(magicLink);
        isNewUser = true;
      } else {
        user = await this.findUserById(magicLink.user_id);
        if (!user) {
          return {
            success: false,
            message: 'User account not found'
          };
        }
      }

      await this.updateUserLastLogin(user.id, ipAddress);

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

      await this.storeRefreshToken(user.id, refreshToken);
      await this.markMagicLinkAsUsed(token);

      const { password_hash, ...safeUser } = user;

      logger.info(`Magic link authentication successful`, {
        userId: user.id,
        email: user.email,
        purpose: magicLink.purpose,
        isNewUser
      });

      return {
        success: true,
        message: isNewUser ? 'Account created and logged in successfully' : 'Logged in successfully',
        user: safeUser,
        token: accessToken,
        refreshToken,
        isNewUser
      };

    } catch (error) {
      console.error('🚨 CRITICAL ERROR in verifyMagicLink:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        token: token.substring(0, 10) + '...',
        email,
        errorCode: error.code,
        errorName: error.name
      });
      
      logger.error('Error verifying magic link:', {
        error: error.message,
        stack: error.stack,
        token: token.substring(0, 10) + '...',
        email
      });
      
      return {
        success: false,
        message: 'Failed to verify magic link. Please try again.'
      };
    }
  }

  /**
   * Generate secure token for magic link
   */
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check rate limiting for magic link requests
   */
  async checkRateLimit(email) {
    try {
      // Development environment should be far more permissive to avoid blocking QA
      if (process.env.NODE_ENV === 'development') {
        return { allowed: true, devBypass: true };
      }

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const query = `
        SELECT COUNT(*) as count
        FROM magic_links 
        WHERE email = $1 
        AND created_at > $2
      `;
      
      const result = await dbManager.query(query, [email, fifteenMinutesAgo]);
      const count = parseInt(result.rows[0].count);

      if (count >= maxRequests) {
        return {
          allowed: false,
          waitTime: 15, // minutes
          count,
          windowMinutes: 15
        };
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Rate limit check error:', error);
      return { allowed: true, error: 'rate-limit-check-failed' }; // fail-open in case of error
    }
  }

  /**
   * Store magic link in database
   */
  async storeMagicLink(linkData) {
    const query = `
      INSERT INTO magic_links (email, token, user_id, purpose, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      linkData.email,
      linkData.token,
      linkData.userId,
      linkData.purpose,
      linkData.ipAddress,
      linkData.userAgent,
      linkData.expiresAt
    ];
    
    const result = await dbManager.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Find magic link by token
   */
  async findMagicLink(token) {
    const query = `
      SELECT * FROM magic_links 
      WHERE token = $1
    `;
    
    const result = await dbManager.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Mark magic link as used
   */
  async markMagicLinkAsUsed(token) {
    const query = `
      UPDATE magic_links 
      SET is_used = true, used_at = CURRENT_TIMESTAMP
      WHERE token = $1
    `;
    
    await dbManager.query(query, [token]);
  }

  /**
   * Invalidate magic link
   */
  async invalidateMagicLink(token) {
    const query = `
      UPDATE magic_links 
      SET is_used = true, used_at = CURRENT_TIMESTAMP
      WHERE token = $1
    `;
    
    await dbManager.query(query, [token]);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    const query = `
      SELECT * FROM users 
      WHERE email = $1
    `;
    
    const result = await dbManager.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findUserById(userId) {
    const query = `
      SELECT * FROM users 
      WHERE id = $1
    `;
    
    const result = await dbManager.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Create user from magic link (for registration)
   */
  async createUserFromMagicLink(magicLink) {
    // Extract name from email (simple approach)
    const emailParts = magicLink.email.split('@')[0];
    const firstName = emailParts.charAt(0).toUpperCase() + emailParts.slice(1);
    
    const query = `
      INSERT INTO users (
        email,
        first_name,
        last_name,
        user_type,
        email_verified,
        email_verified_at,
        status,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)
      RETURNING *
    `;
    
    const values = [
      magicLink.email,
      firstName,
      '', // Placeholder last name; user can update profile later
      'consumer',
      true,
      'ACTIVE',
      null
    ];
    
    const result = await dbManager.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user's last login
   */
  async updateUserLastLogin(userId, ipAddress) {
    const query = `
      UPDATE users 
      SET "lastLoginAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await dbManager.query(query, [userId]);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type
      },
      this.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      {
        userId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || this.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId, refreshToken) {
    // Check if user_sessions table exists, if not use simple approach
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const query = `
        INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
        refresh_token = $3,
        expires_at = $4,
        updated_at = CURRENT_TIMESTAMP
      `;
      
      await dbManager.query(query, [userId, crypto.randomUUID(), refreshToken, expiresAt]);
    } catch (error) {
      // Fallback: just log the refresh token (not recommended for production)
      logger.info(`Refresh token for user ${userId}: ${refreshToken}`);
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email, magicLinkUrl, purpose, firstName = '', webFallbackUrl = '') {
    try {
      const isLogin = purpose === 'LOGIN';
      const subject = isLogin ? 'Your FixRx Login Link' : 'Complete Your FixRx Registration';

      const emailService = EmailService.getInstance();
      if (!emailService || !emailService.isConfigured) {
        logger.warn('Email service not configured, skipping magic link email');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">FixRx</h1>
            <p style="color: #666; margin: 5px 0;">Your Trusted Service Platform</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">
              ${isLogin ? `Welcome back${firstName ? `, ${firstName}` : ''}!` : 'Welcome to FixRx!'}
            </h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
              ${isLogin 
                ? 'Click the button below to securely log in to your FixRx account. This link will expire in 15 minutes for your security.'
                : 'Click the button below to complete your registration and start connecting with trusted service providers. This link will expire in 15 minutes.'
              }
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLinkUrl}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-bottom: 10px;">
                ${isLogin ? 'Sign In to FixRx' : 'Complete Registration'}
              </a>
              ${webFallbackUrl ? `<br><a href="${webFallbackUrl}" 
                 style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-top: 10px;">
                Open Direct Link
              </a>` : ''}
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              ${webFallbackUrl ? 'Click the button above to open the FixRx app and complete your authentication.' : 'If the button doesn\'t work, copy and paste this link:'}
            </p>
            ${webFallbackUrl ? `<p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
              <strong>Note:</strong> The link will automatically open the FixRx app on your device.
            </p>` : `<p style="color: #2563eb; font-size: 14px; word-break: break-all; margin-top: 5px;">
              ${magicLinkUrl}
            </p>`}
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
              <strong>Security Notice:</strong>
            </p>
            <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
              <li>This link will expire in 15 minutes</li>
              <li>It can only be used once</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 FixRx. All rights reserved.
            </p>
          </div>
        </div>`;

      const emailResult = await emailService.sendEmail({
        to: email,
        subject,
        html
      });

      if (!emailResult.success) {
        logger.error('Error sending magic link email:', emailResult.error);
        return {
          success: false,
          error: emailResult.error
        };
      }
      
      return emailResult;
    }
    catch (error) {
      logger.error('Error sending magic link email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up expired magic links
   */
  async cleanupExpiredLinks() {
    try {
      const query = `
        DELETE FROM magic_links 
        WHERE expires_at < CURRENT_TIMESTAMP
        OR (is_used = true AND used_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')
      `;
      
      const result = await dbManager.query(query);
      logger.info(`Cleaned up ${result.rowCount} expired magic links`);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up expired magic links:', error);
      return 0;
    }
  }

  /**
   * Health check for magic link service
   */
  async healthCheck() {
    try {
      // Test database connection
      await dbManager.query('SELECT 1');
      
      // Email service health is based on configuration
      const emailService = EmailService.getInstance();
      const emailHealthy = !!(emailService && emailService.isConfigured);
      
      return {
        database: true,
        email: emailHealthy,
        overall: emailHealthy
      };
    } catch (error) {
      logger.error('Magic link service health check failed:', error);
      return {
        database: false,
        email: false,
        overall: false
      };
    }
  }
}

module.exports = new MagicLinkService();
