/**
 * Performance Middleware
 * Implements the middleware stack as specified in Phase 1 Architecture
 * Request → Rate Limiting → CORS → Auth Validation → Request Logging → Route Handler → Response
 */

const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { analyticsService } = require('../services/analyticsService');

/**
 * Performance monitoring middleware
 * Tracks API response times and system performance metrics
 */
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Track performance metrics as specified in architecture
    if (analyticsService && analyticsService.trackPerformance) {
      analyticsService.trackPerformance(
        req.route?.path || req.path,
        req.method,
        responseTime,
        res.statusCode,
        req.user?.id,
        res.statusCode >= 400 ? res.locals.errorMessage : null
      );
    }
    
    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests (>500ms as per architecture spec)
    if (responseTime > 500) {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Rate limiting configuration as per architecture specification
 * Prevents abuse and ensures system stability
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Track rate limit violations
      if (analyticsService && analyticsService.trackUserEvent) {
        analyticsService.trackUserEvent(
          req.user?.id || 'anonymous',
          'rate_limit_exceeded',
          {
            ip: req.ip,
            endpoint: req.path,
            method: req.method
          }
        );
      }
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};

/**
 * CORS configuration for cross-origin requests
 * Configured for mobile app and web dashboard access
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3001',
      'https://fixrx.com',
      'https://app.fixrx.com',
      'https://admin.fixrx.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

/**
 * Security headers middleware
 * Implements security best practices as per architecture specification
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.auth0.com", "https://api.twilio.com", "https://api.sendgrid.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request logging middleware
 * Structured logging for monitoring and debugging
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Compression middleware for response optimization
 * Reduces bandwidth usage and improves performance
 */
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1KB
});

/**
 * Health check middleware
 * Provides system health status without authentication
 */
const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          usage: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
        },
        version: process.env.npm_package_version || '1.0.0'
      }
    });
  }
  next();
};

/**
 * Error handling middleware
 * Centralized error handling with structured responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // Track error in analytics
  if (analyticsService && analyticsService.trackUserEvent) {
    analyticsService.trackUserEvent(
      req.user?.id || 'anonymous',
      'api_error',
      {
        error: err.message,
        path: req.path,
        method: req.method,
        statusCode: err.statusCode || 500
      }
    );
  }
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
      requestId: req.id || Date.now().toString()
    }
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.id || Date.now().toString()
    }
  });
};

/**
 * Circuit breaker middleware for external service calls
 * Implements fallback strategy as per architecture specification
 */
const circuitBreaker = (serviceName, fallbackResponse = null) => {
  const failures = new Map();
  const FAILURE_THRESHOLD = 5;
  const RECOVERY_TIMEOUT = 60000; // 1 minute
  
  return (req, res, next) => {
    const serviceFailures = failures.get(serviceName) || { count: 0, lastFailure: 0 };
    
    // Check if circuit is open
    if (serviceFailures.count >= FAILURE_THRESHOLD) {
      const timeSinceLastFailure = Date.now() - serviceFailures.lastFailure;
      
      if (timeSinceLastFailure < RECOVERY_TIMEOUT) {
        console.warn(`Circuit breaker OPEN for ${serviceName}`);
        
        if (fallbackResponse) {
          return res.json(fallbackResponse);
        }
        
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: `${serviceName} is temporarily unavailable`,
            retryAfter: Math.ceil((RECOVERY_TIMEOUT - timeSinceLastFailure) / 1000)
          }
        });
      } else {
        // Reset circuit breaker
        failures.delete(serviceName);
        console.info(`Circuit breaker RESET for ${serviceName}`);
      }
    }
    
    // Add failure tracking to request
    req.circuitBreaker = {
      recordFailure: () => {
        const current = failures.get(serviceName) || { count: 0, lastFailure: 0 };
        failures.set(serviceName, {
          count: current.count + 1,
          lastFailure: Date.now()
        });
        console.warn(`Circuit breaker failure recorded for ${serviceName}: ${current.count + 1}/${FAILURE_THRESHOLD}`);
      },
      recordSuccess: () => {
        failures.delete(serviceName);
      }
    };
    
    next();
  };
};

module.exports = {
  performanceMonitoring,
  createRateLimiter,
  corsOptions,
  securityHeaders,
  requestLogger,
  compressionMiddleware,
  healthCheck,
  errorHandler,
  notFoundHandler,
  circuitBreaker,
  
  // Pre-configured rate limiters for different endpoints
  rateLimiters: {
    general: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
    auth: createRateLimiter(15 * 60 * 1000, 20),     // 20 auth requests per 15 minutes
    sms: createRateLimiter(60 * 1000, 10),           // 10 SMS per minute
    email: createRateLimiter(60 * 1000, 20),         // 20 emails per minute
    search: createRateLimiter(60 * 1000, 60)         // 60 searches per minute
  }
};
