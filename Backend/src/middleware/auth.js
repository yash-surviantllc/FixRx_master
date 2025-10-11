const jwt = require('jsonwebtoken');
const { dbManager } = require('../config/database');

/**
 * Authenticate JWT Token Middleware for OTP-based authentication
 */
const authenticateToken = async (req, res, next) => {
  try {
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

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const result = await dbManager.query(
      `SELECT id, email, first_name, last_name, user_type, phone, 
              phone_verified, status 
       FROM users 
       WHERE id = $1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Attach user to request with consistent format
    req.user = {
      id: user.id,
      userId: user.id, // For compatibility
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      phone: user.phone,
      phoneVerified: user.phone_verified
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
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
