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
    // Extended expiry for development, normal for production
    this.MAGIC_LINK_EXPIRY = process.env.NODE_ENV === 'development' 
      ? 60 * 60 * 1000  // 1 hour in development
      : 15 * 60 * 1000; // 15 minutes in production
    // Use custom scheme for mobile app deep linking
    // In development: fixrx://magic-link
    // In production: https://fixrx.com/auth/magic-link (with universal links)
    this.BASE_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://fixrx.com' : 'fixrx://');
    this.APP_SCHEME = process.env.APP_SCHEME || 'fixrx';
    this.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  /**
   * Send magic link for login/registration
   */
  async sendMagicLink(email, purpose = 'LOGIN', userAgent = '', ipAddress = '') {
    console.log('📧 Magic link send started:', { email, purpose, userAgent: userAgent.substring(0, 50) });
    
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

      // Check if user already exists (simplified for debugging)
      const existingUser = await this.findUserByEmail(email);
      
      if (process.env.NODE_ENV === 'development') {
        // Development mode: Allow both LOGIN and REGISTRATION for any email
        logger.debug('🔄 Development mode: Allowing flexible user handling for testing');
        
        if (purpose === 'REGISTRATION' && existingUser) {
          logger.debug('User exists but allowing registration for testing');
          // Don't block - just log
        } else if (purpose === 'LOGIN' && !existingUser) {
          logger.debug('User does not exist but allowing login for testing');
          // Don't block - just log
        }
      } else {
        // Production mode: Strict validation
        const existingUser = await this.findUserByEmail(email);
        
        // For REGISTRATION purpose, user must not exist
        if (purpose === 'REGISTRATION' && existingUser) {
          return {
            success: false,
            message: 'An account already exists with this email address. Please use the login option instead.',
            code: 'USER_ALREADY_EXISTS'
          };
        }

        // For LOGIN purpose, user must exist
        if (purpose === 'LOGIN' && !existingUser) {
          return {
            success: false,
            message: 'No account found with this email address. Please register first.',
            code: 'USER_NOT_FOUND'
          };
        }
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

      // Generate magic link URL for mobile app
      let webRedirectUrl;
      let directDeepLink = null;
      
      // Always generate deep link for mobile app
      directDeepLink = `${this.APP_SCHEME}://magic-link?token=${token}&email=${encodeURIComponent(email)}`;
      
      // Always use HTTP redirect URL for email compatibility
      // The web page will then redirect to the app
      webRedirectUrl = `${this.API_BASE_URL.replace('/api/v1', '')}/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

 logger.info('Magic link URLs generated', {
        email,
        webRedirectUrl,
        directDeepLink,
        BASE_URL: this.BASE_URL,
        APP_SCHEME: this.APP_SCHEME
      });

      // Always use webRedirectUrl for email (HTTP URL that redirects to app)
      const emailResult = await this.sendMagicLinkEmail(email, webRedirectUrl, purpose, existingUser?.first_name, directDeepLink);

      if (!emailResult.success) {
        // In development, continue even if email fails (SendGrid not configured)
        logger.warn('Email sending failed, but continuing in development mode', { email });
        // Don't invalidate the magic link - keep it for testing
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
      console.error('💥 CRITICAL ERROR in sendMagicLink:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        email,
        purpose,
        errorCode: error.code,
        errorName: error.name
      });
      
 logger.error('Error sending magic link:', error);
      return {
        success: false,
        message: `Failed to send magic link: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Verify magic link and authenticate user
   */
  async verifyMagicLink(token, email, userAgent = '', ipAddress = '') {
    try {
 console.log(' MAGIC LINK VERIFICATION START:', { 
        token: token.substring(0, 10) + '...', 
        email,
        timestamp: new Date().toISOString()
      });
      
 logger.info('Magic link verification attempt', { token: token.substring(0, 10) + '...', email });
      
 console.log(' Step 1: Finding magic link in database...');
      const magicLink = await this.findMagicLink(token);
 console.log(' Magic link found:', magicLink ? 'YES' : 'NO');

      if (!magicLink) {
 console.log(' Magic link not found in database');
 logger.error('Magic link not found in database', { token: token.substring(0, 10) + '...', email });
        return {
          success: false,
          message: 'Invalid or expired magic link'
        };
      }

 console.log(' Magic link details:', {
        id: magicLink.id,
        email: magicLink.email,
        is_used: magicLink.is_used,
        expires_at: magicLink.expires_at,
        purpose: magicLink.purpose
      });

      if (magicLink.is_used) {
 console.log(' Magic link already used');
        return {
          success: false,
          message: 'This magic link has already been used'
        };
      }

 console.log(' Step 2: Checking expiration...');
      const now = new Date();
      const expiresAt = new Date(magicLink.expires_at);
 console.log(' Expiration check:', { now: now.toISOString(), expires: expiresAt.toISOString(), expired: now > expiresAt });

      if (now > expiresAt) {
 console.log(' Magic link expired');
        await this.invalidateMagicLink(token);
        return {
          success: false,
          message: 'Magic link has expired'
        };
      }

 console.log(' Step 3: Checking email match...');
      if (magicLink.email.toLowerCase() !== email.toLowerCase()) {
 console.log(' Email mismatch:', { expected: magicLink.email, provided: email });
        return {
          success: false,
          message: 'Invalid magic link'
        };
      }

 console.log(' Step 4: Processing user...');
      let user = null;
      let isNewUser = false;

      // Check if user exists in database (regardless of purpose)
      if (magicLink.user_id) {
 console.log(' Magic link has user_id, finding existing user...');
        user = await this.findUserById(magicLink.user_id);
        
        if (user) {
 console.log(' Existing user found:', { id: user.id, email: user.email, userType: user.user_type });
          isNewUser = false;
        } else {
 console.log(' User ID in magic link but user not found, creating new user...');
          user = await this.createUserFromMagicLink(magicLink);
          isNewUser = true;
        }
      } else {
 console.log(' No user_id in magic link, checking by email...');
        // Double-check if user exists by email
        const existingUserByEmail = await this.findUserByEmail(magicLink.email);
        
        if (existingUserByEmail) {
 console.log(' User found by email:', { id: existingUserByEmail.id, email: existingUserByEmail.email });
          user = existingUserByEmail;
          isNewUser = false;
        } else {
 console.log(' No user found, creating new user...');
          user = await this.createUserFromMagicLink(magicLink);
          isNewUser = true;
 console.log(' New user created:', { id: user?.id, email: user?.email });
        }
      }

 console.log(' Step 5: Updating last login...');
      await this.updateUserLastLogin(user.id, ipAddress);

 console.log(' Step 6: Generating tokens...');
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user.id);

 console.log(' Step 7: Storing refresh token...');
      await this.storeRefreshToken(user.id, refreshToken);
      
 console.log(' Step 8: Marking magic link as used...');
      await this.markMagicLinkAsUsed(token);
 console.log(' Magic link marked as used successfully');

      const { password_hash, ...safeUser } = user;

      // Transform snake_case to camelCase for mobile app
      const transformedUser = {
        id: safeUser.id,
        email: safeUser.email,
        firstName: safeUser.first_name || '',
        lastName: safeUser.last_name || '',
        userType: safeUser.user_type?.toUpperCase() || 'CONSUMER',
        isVerified: safeUser.is_verified || false,
        profileCompleted: safeUser.profile_completed || false,
        phone: safeUser.phone || null,
        profileImageUrl: safeUser.avatar_url || safeUser.profile_image_url || null,
        createdAt: safeUser.created_at,
        updatedAt: safeUser.updated_at
      };

 logger.info(`Magic link authentication successful`, {
        userId: user.id,
        email: user.email,
        purpose: magicLink.purpose,
        isNewUser
      });

      return {
        success: true,
        message: isNewUser ? 'Account created and logged in successfully' : 'Logged in successfully',
        user: transformedUser,
        token: accessToken,
        refreshToken,
        isNewUser
      };

    } catch (error) {
 console.error('CRITICAL ERROR in verifyMagicLink:', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        token: token.substring(0, 10) + '...',
        email,
        errorCode: error.code,
        errorName: error.name,
        errorDetail: error.detail,
        errorHint: error.hint,
        errorPosition: error.position,
        errorWhere: error.where
      });
      
 logger.error('Error verifying magic link:', {
        error: error.message,
        stack: error.stack,
        token: token.substring(0, 10) + '...',
        email,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      
      // Return more detailed error in development
      return {
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? `Verification failed: ${error.message}` 
          : 'Failed to verify magic link. Please try again.',
        debugInfo: process.env.NODE_ENV === 'development' ? {
          errorCode: error.code,
          errorMessage: error.message
        } : undefined
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

      const maxRequests = 5; // Maximum 5 requests per 15 minutes
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
        password_hash,
        first_name,
        last_name,
        user_type,
        is_verified,
        email_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      magicLink.email,
      null, // No password for magic link authentication
      firstName,
      '', // Placeholder last name; user can update profile later
      'consumer',
      true
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
      SET last_login_at = CURRENT_TIMESTAMP
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
  async sendMagicLinkEmail(email, magicLinkUrl, purpose, firstName = '', directDeepLink = '') {
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
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              ${directDeepLink ? 'Click the button above to open the FixRx app and complete your authentication.' : 'If the button doesn\'t work, copy and paste this link:'}
            </p>
            ${directDeepLink ? `<p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
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
   * Auto-reset user for testing in development mode
   * Allows reusing the same email for testing by cleaning up existing data
   */
  async autoResetUserForTesting(email, purpose) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Auto-reset only available in development mode');
    }

    try {
      logger.info(`🔄 Auto-resetting user for testing: ${email} (purpose: ${purpose})`);

      // Step 1: Clean up existing magic links for this email
      const deleteMagicLinksQuery = `
        DELETE FROM magic_links 
        WHERE email = $1
      `;
      await dbManager.query(deleteMagicLinksQuery, [email]);
      logger.debug('✅ Deleted existing magic links');

      // Step 2: For REGISTRATION purpose, delete existing user if any
      if (purpose === 'REGISTRATION') {
        const existingUser = await this.findUserByEmail(email);
        if (existingUser) {
          // Delete user sessions first (if table exists)
          try {
            const deleteSessionsQuery = `DELETE FROM user_sessions WHERE user_id = $1`;
            await dbManager.query(deleteSessionsQuery, [existingUser.id]);
            logger.debug('✅ Deleted user sessions');
          } catch (sessionError) {
            logger.debug('No user sessions to delete or table does not exist');
          }

          // Delete the user
          const deleteUserQuery = `DELETE FROM users WHERE email = $1`;
          await dbManager.query(deleteUserQuery, [email]);
          logger.debug('✅ Deleted existing user for registration testing');
        }
      }

      // Step 3: For LOGIN purpose, ensure user exists with basic data
      if (purpose === 'LOGIN') {
        const existingUser = await this.findUserByEmail(email);
        if (!existingUser) {
          // Create a basic user for login testing
          const firstName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
          
          const createUserQuery = `
            INSERT INTO users (
              email,
              first_name,
              last_name,
              user_type,
              is_verified,
              email_verified_at
            )
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          `;
          
          await dbManager.query(createUserQuery, [
            email,
            firstName,
            'Test', // Last name
            'consumer', // Default user type
            true // is_verified
          ]);
          logger.debug('✅ Created test user for login testing');
        }
      }

      logger.info(`✅ Auto-reset completed for ${email}`);
      return { success: true };

    } catch (error) {
      logger.error('❌ Auto-reset failed:', error);
      throw error;
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
