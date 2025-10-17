/**
 * Enhanced Authentication Middleware for FixRx
 * Provides advanced security features and token management
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const prisma = new PrismaClient();

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        userType: string;
        isVerified: boolean;
        sessionId?: string;
      };
    }
  }
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  userType: string;
  isVerified: boolean;
  sessionId?: string;
}

class EnhancedAuthMiddleware {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

  // Enhanced JWT Token Verification
  async authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          userType: true,
          isVerified: true,
          isActive: true,
          passwordChangedAt: true,
          securitySettings: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
        return;
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt && decoded.iat) {
        const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (passwordChangedTimestamp > decoded.iat) {
          res.status(401).json({
            success: false,
            message: 'Token invalid due to password change. Please login again.'
          });
          return;
        }
      }

      // Check session timeout
      const securitySettings = user.securitySettings as any;
      if (securitySettings?.sessionTimeout) {
        const sessionTimeoutMs = securitySettings.sessionTimeout * 60 * 1000; // Convert to milliseconds
        const tokenAge = Date.now() - (decoded.iat * 1000);
        
        if (tokenAge > sessionTimeoutMs) {
          res.status(401).json({
            success: false,
            message: 'Session expired due to timeout'
          });
          return;
        }
      }

      // Attach user to request
      req.user = {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      };

      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        console.error('Authentication error:', error);
        res.status(500).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    }
  }

  // Optional Authentication (doesn't fail if no token)
  async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, this.JWT_SECRET) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            userType: true,
            isVerified: true,
            isActive: true
          }
        });

        if (user && user.isActive) {
          req.user = {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            isVerified: user.isVerified
          };
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  }

  // Role-based Authorization
  requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.userType)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  }

  // Email Verification Required
  requireEmailVerification(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required',
        requiresVerification: true
      });
      return;
    }

    next();
  }

  // Account Status Check
  async requireActiveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { isActive: true, suspendedAt: true, suspensionReason: true }
      });

      if (!user || !user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated or suspended',
          suspensionReason: user?.suspensionReason
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Account status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Account verification failed'
      });
    }
  }

  // Security Headers Middleware
  securityHeaders() {
    return helmet({
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
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // API Rate Limiting
  createRateLimit(windowMs: number, max: number, message?: string) {
    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message: message || 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: message || 'Too many requests, please try again later',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  }

  // IP-based Rate Limiting
  createIPRateLimit(windowMs: number, max: number) {
    return rateLimit({
      windowMs,
      max,
      keyGenerator: (req) => req.ip,
      message: {
        success: false,
        message: 'Too many requests from this IP'
      }
    });
  }

  // User-based Rate Limiting
  createUserRateLimit(windowMs: number, max: number) {
    return rateLimit({
      windowMs,
      max,
      keyGenerator: (req) => req.user?.userId || req.ip,
      message: {
        success: false,
        message: 'Too many requests from this user'
      }
    });
  }

  // Request Logging Middleware
  requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.userId || 'Anonymous'}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  // CORS Configuration
  corsOptions = {
    origin: function (origin: string | undefined, callback: Function) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:19006',
        'http://127.0.0.1:19006',
        'exp://localhost:19000',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  };

  // Input Sanitization
  sanitizeInput(req: Request, res: Response, next: NextFunction): void {
    // Basic XSS protection - remove script tags and dangerous characters
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    
    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  }

  // Session Management
  async validateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        next();
        return;
      }

      // Check for concurrent sessions if enabled
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { securitySettings: true }
      });

      const securitySettings = user?.securitySettings as any;
      
      if (securitySettings?.maxConcurrentSessions) {
        const activeSessions = await prisma.refreshToken.count({
          where: {
            userId: req.user.userId,
            expiresAt: { gt: new Date() }
          }
        });

        if (activeSessions > securitySettings.maxConcurrentSessions) {
          res.status(401).json({
            success: false,
            message: 'Maximum concurrent sessions exceeded'
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Session validation error:', error);
      next();
    }
  }
}

// Export singleton instance
export const enhancedAuthMiddleware = new EnhancedAuthMiddleware();

// Export individual middleware functions for convenience
export const authenticateToken = enhancedAuthMiddleware.authenticateToken.bind(enhancedAuthMiddleware);
export const optionalAuth = enhancedAuthMiddleware.optionalAuth.bind(enhancedAuthMiddleware);
export const requireRole = enhancedAuthMiddleware.requireRole.bind(enhancedAuthMiddleware);
export const requireEmailVerification = enhancedAuthMiddleware.requireEmailVerification.bind(enhancedAuthMiddleware);
export const requireActiveAccount = enhancedAuthMiddleware.requireActiveAccount.bind(enhancedAuthMiddleware);
export const securityHeaders = enhancedAuthMiddleware.securityHeaders.bind(enhancedAuthMiddleware);
export const requestLogger = enhancedAuthMiddleware.requestLogger.bind(enhancedAuthMiddleware);
export const sanitizeInput = enhancedAuthMiddleware.sanitizeInput.bind(enhancedAuthMiddleware);
export const validateSession = enhancedAuthMiddleware.validateSession.bind(enhancedAuthMiddleware);

export default enhancedAuthMiddleware;
