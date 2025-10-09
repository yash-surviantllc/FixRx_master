/**
 * Middleware Stack
 * Architecture: Request → Rate Limiting → CORS → Auth Validation → Request Logging → Route Handler → Response
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { auth0Service } = require('../services/auth0Service');
const { dbManager } = require('../config/database');

// Rate Limiting Middleware
const createRateLimiter = (windowMs, max, message, keyGenerator = null) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    keyGenerator: keyGenerator || ((req) => {
      return req.ip + ':' + (req.user?.id || 'anonymous');
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn('⚠️ Rate limit exceeded:', {
        ip: req.ip,
        user: req.user?.id || 'anonymous',
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests from this IP, please try again later.'
  ),

  // Authentication endpoints (stricter)
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests per window
    'Too many authentication attempts, please try again later.'
  ),

  // API endpoints (moderate)
  api: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    60, // 60 requests per minute
    'API rate limit exceeded, please slow down.'
  ),

  // Search endpoints (higher limit)
  search: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    30, // 30 searches per minute
    'Search rate limit exceeded, please wait before searching again.'
  ),

  // Upload endpoints (very strict)
  upload: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    10, // 10 uploads per 5 minutes
    'Upload rate limit exceeded, please wait before uploading again.'
  )
};

// Security Headers Middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:19006',
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:19006',
      'exp://localhost:19000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'X-Device-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 hours
};

// Request Logging Middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  req.requestId = requestId;
  req.startTime = start;

  // Log request
  console.log(`📥 [${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100),
    contentLength: req.get('Content-Length'),
    user: req.user?.id || 'anonymous'
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`📤 [${requestId}] ${res.statusCode} ${req.method} ${req.path}`, {
      duration: `${duration}ms`,
      size: data?.length || 0,
      user: req.user?.id || 'anonymous'
    });

    // Store metrics
    storeRequestMetrics(req, res, duration);

    return originalSend.call(this, data);
  };

  next();
};

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required',
          details: 'No valid token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    const validation = await auth0Service.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid or expired token',
          details: validation.error
        }
      });
    }

    req.user = validation.user;
    req.token = token;

    next();

  } catch (error) {
    console.error('❌ Authentication Error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: error.message
      }
    });
  }
};

// Optional Authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validation = await auth0Service.validateToken(token);

      if (validation.valid) {
        req.user = validation.user;
        req.token = token;
      }
    }

    next();

  } catch (error) {
    // Don't fail on optional auth errors
    console.warn('⚠️ Optional Auth Warning:', error.message);
    next();
  }
};

// Role-based Authorization Middleware
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'User not authenticated'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('⚠️ Role access denied:', {
        user: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges',
          details: `Required roles: ${allowedRoles.join(', ')}`,
          userRole: req.user.role
        }
      });
    }

    next();
  };
};

// Permission-based Authorization Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'User not authenticated'
        }
      });
    }

    if (!req.user.permissions.includes(permission)) {
      console.warn('⚠️ Permission denied:', {
        user: req.user.id,
        userRole: req.user.role,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        endpoint: req.path
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: `Required permission: ${permission}`,
          userRole: req.user.role,
          userPermissions: req.user.permissions
        }
      });
    }

    next();
  };
};

// Input Validation Middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validationErrors
        }
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled Error:', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'anonymous'
  });

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        details: 'A record with this information already exists'
      }
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Invalid reference',
        details: 'Referenced resource does not exist'
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
        details: err.message
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        details: 'Please refresh your token'
      }
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.message
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      requestId: req.requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// 404 Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      details: `${req.method} ${req.path} is not a valid endpoint`,
      requestId: req.requestId
    }
  });
};

// Compression Middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1KB
});

// Request Metrics Storage
async function storeRequestMetrics(req, res, duration) {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      requestId: req.requestId
    };

    // Store in Redis for real-time monitoring
    await dbManager.setCache(`metrics:${req.requestId}`, metrics, 3600);

    // Aggregate metrics
    const hourKey = `metrics:hour:${new Date().toISOString().substring(0, 13)}`;
    const currentHourMetrics = await dbManager.getCache(hourKey) || {
      requests: 0,
      totalDuration: 0,
      errors: 0,
      statusCodes: {}
    };

    currentHourMetrics.requests++;
    currentHourMetrics.totalDuration += duration;
    if (res.statusCode >= 400) currentHourMetrics.errors++;
    currentHourMetrics.statusCodes[res.statusCode] = (currentHourMetrics.statusCodes[res.statusCode] || 0) + 1;

    await dbManager.setCache(hourKey, currentHourMetrics, 3600);

  } catch (error) {
    console.error('❌ Metrics Storage Failed:', error);
  }
}

// Health Check Middleware
const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }
  next();
};

module.exports = {
  rateLimiters,
  securityHeaders,
  corsOptions,
  requestLogger,
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  validateInput,
  errorHandler,
  notFoundHandler,
  compressionMiddleware,
  healthCheck
};
