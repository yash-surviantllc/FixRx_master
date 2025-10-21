/**
 * FixRx Main Application Server
 * Architecture: Hybrid Mobile + RESTful API + Microservices Integration
 * Following SOW-001-2025 Technical Architecture
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { dbManager } = require('./config/database');
const { queueManager } = require('./services/queueManager');
const { auth0Service } = require('./services/auth0Service');
const { geoSearchService } = require('./services/geoSearchService');
const { monitoringService } = require('./services/monitoringService');
const socketManager = require('./services/socketManager');

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using default secret. This is not recommended for production.');
  process.env.JWT_SECRET = 'your-secret-key';
}

const {
  rateLimiters,
  securityHeaders,
  corsOptions,
  requestLogger,
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  errorHandler,
  notFoundHandler,
  compressionMiddleware,
  healthCheck
} = require('./middleware');

class FixRxApplication {
  constructor() {
    this.app = express();
    this.server = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
 console.log('Initializing FixRx Application...'); 

      // Initialize core services
      await this.initializeServices();
      
      // Setup middleware stack
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup web redirect routes
      this.setupWebRedirectRoutes();
      
      // Setup error handling (must be last)
      this.setupErrorHandling();

      this.isInitialized = true;
 console.log('FixRx Application Initialized Successfully'); 

      return {
        initialized: true,
        services: {
          database: dbManager.getStatus(),
          queue: queueManager.isInitialized,
          auth0: auth0Service.getStatus(),
          geoSearch: geoSearchService.getStatus(),
          monitoring: monitoringService.getStatus()
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
 console.error('FixRx Application Initialization Failed:', error); 
      throw error;
    }
  }

  async initializeServices() {
 console.log('Initializing Services...'); 

    // Initialize Database Manager (PostgreSQL + Redis)
    try {
      await dbManager.initialize();
    } catch (error) {
      console.warn('⚠️ Database initialization failed, continuing without database:', error.message);
      // Continue without database - magic links will still work
    }
    
    // Initialize Queue Manager (Bull Queue)
    try {
      await queueManager.initialize();
    } catch (error) {
      console.warn('⚠️ Queue Manager initialization failed, continuing without queues:', error.message);
    }
    
    // Initialize Auth0 Service
    try {
      await auth0Service.initialize();
    } catch (error) {
      console.warn('⚠️ Auth0 initialization failed, continuing with basic auth:', error.message);
    }
    
    // Initialize Geographic Search Service
    try {
      await geoSearchService.initialize();
    } catch (error) {
      console.warn('⚠️ Geo Search initialization failed, continuing without geo search:', error.message);
    }
    
    // Initialize Monitoring Service
    try {
      await monitoringService.initialize();
    } catch (error) {
      console.warn('⚠️ Monitoring initialization failed, continuing without monitoring:', error.message);
    }

 console.log('All Services Initialized'); 
  }

  setupMiddleware() {
 console.log('Setting up Middleware Stack...'); 

    // Health check (before other middleware)
    this.app.use(healthCheck);

    // Compression
    this.app.use(compressionMiddleware);

    // Security headers
    this.app.use(securityHeaders);

    // CORS
    this.app.use(require('cors')(corsOptions));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting (applied to specific routes)
    this.app.use('/api/v1/auth', rateLimiters.auth);
    this.app.use('/api/v1/search', rateLimiters.search);
    this.app.use('/api/v1/upload', rateLimiters.upload);
    this.app.use('/api/v1', rateLimiters.api);
    this.app.use('/', rateLimiters.general);

 console.log('Middleware Stack Configured'); 
  }

  setupRoutes() {
 console.log('Setting up Routes...'); 

    // API Routes
    this.setupAuthRoutes();
    this.setupUserRoutes();
    this.setupVendorRoutes();
    this.setupConsumerRoutes();
    this.setupSearchRoutes();
    this.setupCommunicationRoutes();
    this.setupContactRoutes();
    this.setupInvitationRoutes();
    this.setupMessagingRoutes();
    this.setupMonitoringRoutes();
    this.setupSystemRoutes();
    this.setupMobileAppRoutes();
    this.setupPaymentRoutes();

 console.log('Routes Configured'); 
  }

  setupAuthRoutes() {
    // Magic Link Authentication Routes
    const magicLinkRoutes = require('./routes/magicLinkRoutes');
    this.app.use('/api/v1/auth/magic-link', magicLinkRoutes);

    // Phone OTP Authentication Routes
    const otpRoutes = require('./routes/otpRoutes');
    this.app.use('/api/v1/auth/otp', otpRoutes);

    // Social OAuth Routes (Google, etc.)
    const oauthRoutes = require('./routes/oauthRoutes');
    this.app.use('/api/v1/auth/oauth', oauthRoutes);

    // Authentication routes
    this.app.post('/api/v1/auth/register', async (req, res, next) => {
      try {
        const { email, password, firstName, lastName, userType, phone, metroArea } = req.body;
        
        // Track business metric
        await monitoringService.trackBusinessMetric('user_registration', 1, { userType });
        
        const result = await auth0Service.createUser({
          email, password, firstName, lastName, userType, phone, metroArea
        });

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: result.localUser.id,
              email: result.localUser.email,
              firstName: result.localUser.first_name,
              lastName: result.localUser.last_name,
              role: result.localUser.role
            }
          }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, severity: 'medium' });
        next(error);
      }
    });

    this.app.post('/api/v1/auth/login', async (req, res, next) => {
      try {
        const { email, password } = req.body;
        
        // Mock login (in production, use Auth0 authentication)
        const user = await auth0Service.getUserByEmail(email);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
          });
        }

        // Create session
        const sessionId = await auth0Service.createSession(user.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            role: user.role 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Track user activity
        await monitoringService.trackUserActivity(user.id, 'login', { userType: user.role });

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            token: token,
            sessionId: sessionId,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              role: user.role
            },
            sessionId
          }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, severity: 'medium' });
        next(error);
      }
    });

    this.app.post('/api/v1/auth/logout', authenticateToken, async (req, res, next) => {
      try {
        await auth0Service.revokeToken(req.token);
        
        res.json({
          success: true,
          message: 'Logout successful'
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupUserRoutes() {
    // User profile routes - PostgreSQL-based (OTP authentication compatible)
    const userRoutes = require('./routes/userRoutes');
    this.app.use('/api/v1/users', userRoutes);
  }

  setupVendorRoutes() {
    // Vendor management routes
    this.app.post('/api/v1/vendors/profile', authenticateToken, requireRole('vendor'), async (req, res, next) => {
      try {
        const profileData = req.body;
        
        // Create vendor profile in database
        const result = await dbManager.query(`
          INSERT INTO vendor_profiles (
            vendor_id, business_name, business_description, business_phone, 
            business_email, service_categories, hourly_rate_min, hourly_rate_max
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          req.user.id, profileData.businessName, profileData.businessDescription,
          profileData.businessPhone, profileData.businessEmail, profileData.serviceCategories,
          profileData.hourlyRateMin, profileData.hourlyRateMax
        ]);

        // Track business metric
        await monitoringService.trackBusinessMetric('vendor_profile_created', 1);

        res.status(201).json({
          success: true,
          message: 'Vendor profile created successfully',
          data: { profile: result.rows[0] }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });

    this.app.get('/api/v1/vendors/:vendorId/profile', optionalAuth, async (req, res, next) => {
      try {
        const { vendorId } = req.params;
        
        const result = await dbManager.query(`
          SELECT vp.*, u.first_name, u.last_name, u.email, u.profile_image
          FROM vendor_profiles vp
          JOIN users u ON vp.vendor_id = u.id
          WHERE vp.vendor_id = $1
        `, [vendorId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: { code: 'VENDOR_NOT_FOUND', message: 'Vendor profile not found' }
          });
        }

        res.json({
          success: true,
          data: { vendor: result.rows[0] }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupConsumerRoutes() {
    // Consumer dashboard
    this.app.get('/api/v1/consumers/dashboard', authenticateToken, requireRole('consumer'), async (req, res, next) => {
      try {
        // Get consumer dashboard data
        const dashboardData = {
          activeServices: 2,
          completedServices: 15,
          savedVendors: 8,
          recentActivity: []
        };

        res.json({
          success: true,
          data: dashboardData
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupSearchRoutes() {
    // Geographic search routes
    this.app.post('/api/v1/search/vendors', optionalAuth, async (req, res, next) => {
      try {
        const { serviceType, location, radiusKm = 10, limit = 20 } = req.body;
        
        // Simple database-based vendor search
        const searchQuery = `
          SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.phone, 
                 u.metro_area, u.profile_image_url, u.created_at,
                 COALESCE(AVG(r.overall_rating), 0) as avg_rating,
                 COUNT(DISTINCT r.id) as review_count
          FROM users u
          LEFT JOIN vendor_services vs ON u.id = vs.vendor_id
          LEFT JOIN services s ON vs.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN ratings r ON u.id = r.rated_id
          WHERE u.user_type = 'VENDOR' 
            AND u.is_active = true
            ${serviceType ? "AND (sc.name ILIKE $1 OR s.name ILIKE $1)" : ""}
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, 
                   u.metro_area, u.profile_image_url, u.created_at
          ORDER BY avg_rating DESC, review_count DESC
          LIMIT $${serviceType ? '2' : '1'}
        `;

        const params = serviceType ? [`%${serviceType}%`, limit] : [limit];
        const result = await dbManager.query(searchQuery, params);

        res.json({
          success: true,
          data: {
            vendors: result.rows,
            searchParams: {
              serviceType,
              location,
              radiusKm,
              resultsCount: result.rows.length
            }
          }
        });

      } catch (error) {
 console.error('Vendor search error:', error); 
        res.status(500).json({
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: 'Failed to search vendors',
            details: error.message
          }
        });
      }
    });

    this.app.get('/api/v1/search/nearby', optionalAuth, async (req, res, next) => {
      try {
        const { lat, lng, radius = 10, limit = 20 } = req.query;
        
        // Simple nearby vendor search (without actual geo calculations for now)
        const nearbyQuery = `
          SELECT u.id, u.first_name, u.last_name, u.email, u.phone, 
                 u.metro_area, u.profile_image_url,
                 COALESCE(AVG(r.overall_rating), 0) as avg_rating,
                 COUNT(DISTINCT r.id) as review_count
          FROM users u
          LEFT JOIN vendor_services vs ON u.id = vs.vendor_id
          LEFT JOIN services s ON vs.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN ratings r ON u.id = r.rated_id
          WHERE u.user_type = 'VENDOR' 
            AND u.is_active = true
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, 
                   u.metro_area, u.profile_image_url
          ORDER BY avg_rating DESC, review_count DESC
          LIMIT $1
        `;

        const result = await dbManager.query(nearbyQuery, [parseInt(limit)]);

        res.json({
          success: true,
          data: { 
            vendors: result.rows,
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: parseInt(radius)
          }
        });

      } catch (error) {
 console.error('Nearby search error:', error); 
        res.status(500).json({
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: 'Failed to find nearby vendors',
            details: error.message
          }
        });
      }
    });
  }

  setupContactRoutes() {
    // Contact Management Routes
    const contactRoutes = require('./routes/contactRoutes');
    this.app.use('/api/v1/contacts', contactRoutes);
  }

  setupInvitationRoutes() {
    // Invitation Management Routes
    const invitationRoutes = require('./routes/invitationRoutes');
    this.app.use('/api/v1/invitations', invitationRoutes);
  }

  setupMessagingRoutes() {
    const messagingRoutes = require('./routes/messagingRoutes');
    this.app.use('/api/v1/messages', rateLimiters.api, messagingRoutes);
  }

  setupCommunicationRoutes() {
    // SMS and Email routes using queue system
    this.app.post('/api/v1/communications/sms/send', authenticateToken, async (req, res, next) => {
      try {
        const { phoneNumber, message, templateId, variables, priority } = req.body;
        
        const job = await queueManager.addSMSJob(phoneNumber, message, {
          templateId,
          variables,
          priority
        });

        res.json({
          success: true,
          message: 'SMS queued for delivery',
          data: { jobId: job.id }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });

    this.app.post('/api/v1/communications/email/send', authenticateToken, async (req, res, next) => {
      try {
        const { to, subject, content, templateId, variables, priority } = req.body;
        
        const job = await queueManager.addEmailJob(to, subject, content, {
          templateId,
          variables,
          priority
        });

        res.json({
          success: true,
          message: 'Email queued for delivery',
          data: { jobId: job.id }
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupMonitoringRoutes() {
    // Monitoring and metrics routes
    this.app.get('/api/v1/monitoring/health', async (req, res, next) => {
      try {
        const healthStatus = await monitoringService.getHealthStatus();
        
        res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
          success: healthStatus.status === 'healthy',
          data: healthStatus
        });

      } catch (error) {
        res.status(503).json({
          success: false,
          error: { code: 'HEALTH_CHECK_FAILED', message: error.message }
        });
      }
    });

    this.app.get('/api/v1/monitoring/metrics', authenticateToken, requireRole('admin'), async (req, res, next) => {
      try {
        const { timeRange = '1h' } = req.query;
        const metrics = await monitoringService.getMetrics(timeRange);
        
        res.json({
          success: true,
          data: metrics
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupSystemRoutes() {
    // System administration routes
    this.app.get('/api/v1/system/status', authenticateToken, requireRole('admin'), async (req, res, next) => {
      try {
        const systemStatus = {
          database: dbManager.getStatus(),
          queue: await queueManager.getQueueStats(),
          auth0: auth0Service.getStatus(),
          geoSearch: geoSearchService.getStatus(),
          monitoring: monitoringService.getStatus(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0'
        };

        res.json({
          success: true,
          data: systemStatus
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });

    this.app.post('/api/v1/system/queue/:queueName/pause', authenticateToken, requireRole('admin'), async (req, res, next) => {
      try {
        const { queueName } = req.params;
        const result = await queueManager.pauseQueue(queueName);
        
        res.json({
          success: result,
          message: result ? `Queue ${queueName} paused` : 'Queue not found'
        });

      } catch (error) {
        await monitoringService.trackError({ error, request: req, user: req.user });
        next(error);
      }
    });
  }

  setupMobileAppRoutes() {
    try {
      console.log('🔧 Setting up Mobile App Routes...');
      
      // Debug: List all routes before adding
      console.log('🔄 Current routes:');
      this.app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          // Routes registered directly on the app
          console.log(`   ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          // Routes added as router
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              console.log(`   ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
            }
          });
        }
      });

      const mobileAppRoutes = require('./routes/mobileAppRoutes');
      this.app.use('/api/v1', mobileAppRoutes);
      
      console.log('✅ Mobile App Routes Configured at /api/v1');
      console.log('   Available endpoints:');
      console.log('   - POST   /api/v1/connections/request');
      console.log('   - GET    /api/v1/connections/requests');
      console.log('   - POST   /api/v1/messages/send');
      console.log('   - POST   /api/v1/ratings/create');
      
    } catch (error) {
      console.error('❌ Failed to setup mobile app routes:', error);
      throw error;
    }
  }

  /**
   * Setup payment related routes
   */
  setupPaymentRoutes() {
    try {
 console.log(' Setting up Payment Routes...'); 
      
      // Load payment routes
      const paymentRoutes = require('./routes/paymentRoutes');
      
      // Apply rate limiting and payment routes
      this.app.use('/api/v1/payments', rateLimiters.api);
      this.app.use('/api/v1/payments', paymentRoutes);
      
 console.log(' Payment Routes Configured'); 
    } catch (error) {
 console.error(' Failed to setup payment routes:', error); 
      throw error; // Re-throw to be caught by the error handler
    }
  }
  
  /**
   * Setup web redirect routes (for magic links, etc.)
   */
  setupWebRedirectRoutes() {
    try {
 console.log(' Setting up Web Redirect Routes...'); 
      const webRedirectRoutes = require('./routes/webRedirectRoutes');
      this.app.use('/magic-link', webRedirectRoutes);
 console.log(' Web Redirect Routes Configured'); 
    } catch (error) {
 console.error(' Failed to setup web redirect routes:', error); 
      throw error;
    }
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
 console.log('️ Setting up Error Handling...'); 
    
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
    
 console.log(' Error Handling Configured'); 
  }

  async start(port = process.env.PORT || 3000) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.server = this.app.listen(port, () => {
 console.log(` 
FixRx Application Server Started
===========================================
Architecture: ${process.env.NODE_ENV || 'development'}
Port: ${port}
Database: ${dbManager.getStatus().connected ? 'Connected' : 'Disconnected'}
Queue: ${queueManager.isInitialized ? 'Active' : 'Inactive'}
Auth0: ${auth0Service.getStatus().initialized ? 'Connected' : 'Disconnected'}
GeoSearch: ${geoSearchService.getStatus().initialized ? 'Active' : 'Inactive'}
Monitoring: ${monitoringService.getStatus().initialized ? 'Active' : 'Inactive'}
===========================================
Ready for Production Traffic!
        `);
      });

      socketManager.initialize(this.server);
      return this.server;

    } catch (error) {
 console.error('Server Start Failed:', error); 
      throw error;
    }
  }

  async stop() {
    try {
      if (this.server) {
        this.server.close();
      }

      // Gracefully shutdown services
      await queueManager.close();
      await dbManager.close();
      socketManager.close();

 console.log('FixRx Application Server Stopped'); 

    } catch (error) {
 console.error('Server Stop Failed:', error); 
    }
  }

  getApp() {
    return this.app;
  }
}

// Export singleton instance
const fixRxApp = new FixRxApplication();

module.exports = {
  FixRxApplication,
  fixRxApp
};
