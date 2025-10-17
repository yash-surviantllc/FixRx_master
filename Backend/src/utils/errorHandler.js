/**
 * Enhanced Error Handler
 * Provides better error handling and logging
 */

const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of errors
 */
function handleError(error, req = null) {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userId: req?.user?.id,
    timestamp: new Date().toISOString()
  });

  // Database errors
  if (error.code === 'ECONNREFUSED') {
    return new AppError(
      'Database connection failed',
      503,
      'DATABASE_UNAVAILABLE',
      { service: 'PostgreSQL' }
    );
  }

  // Redis errors
  if (error.message?.includes('Redis')) {
    return new AppError(
      'Cache service unavailable',
      503,
      'CACHE_UNAVAILABLE',
      { service: 'Redis' }
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      'Invalid authentication token',
      401,
      'INVALID_TOKEN'
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError(
      'Authentication token expired',
      401,
      'TOKEN_EXPIRED'
    );
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: error.details }
    );
  }

  // Return original error if it's already an AppError
  if (error.isOperational) {
    return error;
  }

  // Unknown errors
  return new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    500,
    'INTERNAL_ERROR'
  );
}

/**
 * Express error handling middleware
 */
function errorMiddleware(error, req, res, next) {
  const handledError = handleError(error, req);

  res.status(handledError.statusCode).json({
    success: false,
    error: {
      code: handledError.code,
      message: handledError.message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: handledError.stack,
        details: handledError.details
      })
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to error middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal, server, cleanup = []) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Run cleanup functions
  for (const cleanupFn of cleanup) {
    try {
      await cleanupFn();
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }

  // Force exit after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

module.exports = {
  AppError,
  handleError,
  errorMiddleware,
  asyncHandler,
  gracefulShutdown,
  logger
};
