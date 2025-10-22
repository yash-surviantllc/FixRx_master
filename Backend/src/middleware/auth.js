const jwt = require('jsonwebtoken');
const { dbManager } = require('../config/database');

/**
 * Authenticate JWT Token Middleware for OTP-based authentication
 */
const authenticateToken = async (req, res, next) => {
  try {
    // DON'T BYPASS AUTH - Always verify the JWT token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token format is invalid',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    try {
      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret);
      
      // Get user ID from token (support both userId and id fields)
      let userId = decoded.userId || decoded.id;
      
      // Development bypass - only use hardcoded user if no valid token provided
      if (process.env.NODE_ENV === 'development' && !userId) {
        console.log('Development: No valid user ID in token, using default test user');
        userId = '7bf186e2-fe2a-4133-9ebb-e6b323078d52'; // john.consumer@example.com
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload',
          code: 'INVALID_TOKEN_PAYLOAD'
        });
      }

      // In development, we can skip the database lookup if we have a valid token
      if (process.env.NODE_ENV === 'development' && decoded.email) {
        console.log('Development: Using token user without database lookup');
        req.user = {
          id: userId,
          userId: userId,
          email: decoded.email,
          user_type: decoded.user_type || 'user',
          is_active: true,
          first_name: decoded.first_name || 'Development',
          last_name: decoded.last_name || 'User'
        };
        return next();
      }

      // Get user from database (production or when needed in development)
      const result = await dbManager.query(
        `SELECT 
          id, 
          email, 
          first_name, 
          last_name, 
          user_type, 
          phone, 
          phone_verified_at,
          email_verified_at,
          is_verified,
          is_active,
          created_at, 
          updated_at
         FROM users 
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Attach user to request with consistent format
      req.user = {
        id: user.id,
        userId: user.id, // For backward compatibility
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        phone: user.phone,
        phoneVerified: !!user.phone_verified_at, // Convert timestamp to boolean
        emailVerified: !!user.email_verified_at, // Convert timestamp to boolean
        isVerified: user.is_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
      // Add token to request for rate limiting and logging
      req.token = token;
      
      next();
      
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          expiredAt: tokenError.expiredAt
        });
      }
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          error: tokenError.message
        });
      }
      
      // Handle other JWT errors
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
        error: tokenError.message
      });
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

/**
 * Legacy verifyToken for backwards compatibility
 */
const verifyToken = authenticateToken;

module.exports = {
  authenticateToken,
  verifyToken
};
