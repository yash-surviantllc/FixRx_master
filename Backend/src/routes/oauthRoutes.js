/**
 * OAuth Routes for FixRx
 * Handles Google OAuth authentication
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { dbManager } = require('../config/database');
const { monitoringService } = require('../services/monitoringService');

const router = express.Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const ensureGoogleConfigured = () => Boolean(googleClientId);

const mapUserForResponse = (userRow = {}) => ({
  id: userRow.id,
  email: userRow.email,
  firstName: userRow.first_name || '',
  lastName: userRow.last_name || '',
  userType: userRow.user_type ? userRow.user_type.toLowerCase() : null,
  isVerified: userRow.is_verified ?? false,
  phone: userRow.phone || null,
  profileImage: userRow.profile_image_url || userRow.profile_image || null,
  metroArea: userRow.metro_area || null,
});

const findUserByEmail = async (email) => {
  const result = await dbManager.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await dbManager.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
};

const createUserFromGoogle = async (profile) => {
  const nameParts = (profile.name || '').split(' ');
  const firstName = profile.given_name || nameParts[0] || '';
  const lastName = profile.family_name || nameParts.slice(1).join(' ') || '';

  const insertQuery = `
    INSERT INTO users (email, first_name, last_name, user_type, is_verified, email_verified_at, profile_image_url)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
    RETURNING *
  `;

  const values = [
    profile.email,
    firstName,
    lastName,
    'CONSUMER',
    true,
    profile.picture || null,
  ];

  const result = await dbManager.query(insertQuery, values);
  return result.rows[0];
};

const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    userType: user.user_type,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d',
  });
};

router.post('/google/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required',
        code: 'MISSING_TOKEN',
      });
    }

    if (!ensureGoogleConfigured() || !googleClient) {
      return res.status(503).json({
        success: false,
        message: 'Google OAuth is not configured',
        code: 'OAUTH_NOT_CONFIGURED',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token payload',
        code: 'TOKEN_VERIFICATION_ERROR',
      });
    }

    if (!payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google account is not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const normalizedEmail = payload.email.toLowerCase();

    let user = await findUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      user = await createUserFromGoogle(payload);
      isNewUser = true;
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account',
        code: 'USER_CREATION_FAILED',
      });
    }

    const token = generateAccessToken(user);
    const safeUser = mapUserForResponse(user);

    try {
      await monitoringService.trackUserActivity(user.id, 'login_google', {
        isNewUser,
      });
    } catch (monitorError) {
      console.warn('⚠️ Google login monitoring failed:', monitorError.message);
    }

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      user: safeUser,
      token,
      isNewUser,
    });
  } catch (error) {
    console.error('❌ Google token verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Google token verification failed',
      code: 'TOKEN_VERIFICATION_ERROR',
    });
  }
});

module.exports = router;
