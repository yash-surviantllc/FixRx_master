const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');
const { dbManager } = require('../config/database');

/**
 * Verify JWT Token Middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    // TEMPORARY: Bypass auth for testing
    if (process.env.NODE_ENV === 'development') {
      req.user = { 
        id: '4c459ce7-c2d9-4c72-8725-f98e58111700',        // John Smith's real ID
        userId: '4c459ce7-c2d9-4c72-8725-f98e58111700',    // John Smith's real ID
        email: 'test@example.com',
        role: 'user',
        is_active: true,
        first_name: 'Test',
        last_name: 'User'
      };
      console.log('Auth bypassed for development');
      return next();
    }

    // YOUR EXISTING AUTH LOGIC CONTINUES UNCHANGED:
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token format is invalid'
        }
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Get user from database
    const client = await dbManager.getConnection();
    const result = await client.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    // Attach user to request (add userId for compatibility)
    req.user = {
      ...user,
      userId: user.id // Add userId property for controllers that expect it
    };
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

module.exports = {
  verifyToken
};
