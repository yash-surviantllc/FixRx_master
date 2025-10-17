/**
 * Analytics Routes
 * API endpoints for analytics and reporting functionality
 */

const express = require('express');
const { analyticsService } = require('../services/analyticsService');
const { authenticateToken, requireRole, requirePermission } = require('../middleware');
const { validateRequest } = require('../utils/validation');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const timeRangeSchema = Joi.object({
  timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').default('30d')
});

const userEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventData: Joi.object().default({}),
  sessionId: Joi.string().optional(),
  deviceInfo: Joi.object().default({}),
  locationData: Joi.object().default({})
});

const vendorMetricSchema = Joi.object({
  metricType: Joi.string().required(),
  metricValue: Joi.number().required(),
  metricData: Joi.object().default({}),
  periodStart: Joi.date().optional(),
  periodEnd: Joi.date().optional()
});

const performanceTrackingSchema = Joi.object({
  endpoint: Joi.string().required(),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
  responseTime: Joi.number().integer().min(0).required(),
  statusCode: Joi.number().integer().min(100).max(599).required(),
  errorMessage: Joi.string().optional()
});

/**
 * @route GET /api/v1/analytics/user
 * @desc Get user analytics data
 * @access Private
 */
router.get('/user', 
  authenticateToken,
  validateRequest({ query: timeRangeSchema }),
  async (req, res) => {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;

      const analytics = await analyticsService.getUserAnalytics(userId, timeRange);

      res.json({
        success: true,
        data: analytics,
        message: 'User analytics retrieved successfully'
      });

    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve user analytics',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/analytics/user/track
 * @desc Track user event
 * @access Private
 */
router.post('/user/track',
  authenticateToken,
  validateRequest({ body: userEventSchema }),
  async (req, res) => {
    try {
      const { eventType, eventData, sessionId, deviceInfo, locationData } = req.body;
      const userId = req.user.id;

      await analyticsService.trackUserEvent(
        userId, 
        eventType, 
        eventData, 
        sessionId, 
        deviceInfo, 
        locationData
      );

      res.json({
        success: true,
        data: { tracked: true },
        message: 'User event tracked successfully'
      });

    } catch (error) {
      console.error('Track user event error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: 'Failed to track user event',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/vendor
 * @desc Get vendor analytics data
 * @access Private (Vendor only)
 */
router.get('/vendor',
  authenticateToken,
  requireRole(['vendor', 'admin']),
  validateRequest({ query: timeRangeSchema }),
  async (req, res) => {
    try {
      const { timeRange } = req.query;
      const vendorId = req.user.role === 'admin' ? req.query.vendorId : req.user.vendorId;

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VENDOR_ID',
            message: 'Vendor ID is required'
          }
        });
      }

      const analytics = await analyticsService.getVendorAnalytics(vendorId, timeRange);

      res.json({
        success: true,
        data: analytics,
        message: 'Vendor analytics retrieved successfully'
      });

    } catch (error) {
      console.error('Get vendor analytics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve vendor analytics',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/analytics/vendor/track
 * @desc Track vendor metric
 * @access Private (Vendor only)
 */
router.post('/vendor/track',
  authenticateToken,
  requireRole(['vendor', 'admin']),
  validateRequest({ body: vendorMetricSchema }),
  async (req, res) => {
    try {
      const { metricType, metricValue, metricData, periodStart, periodEnd } = req.body;
      const vendorId = req.user.role === 'admin' ? req.body.vendorId : req.user.vendorId;

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VENDOR_ID',
            message: 'Vendor ID is required'
          }
        });
      }

      await analyticsService.trackVendorMetric(
        vendorId,
        metricType,
        metricValue,
        metricData,
        periodStart,
        periodEnd
      );

      res.json({
        success: true,
        data: { tracked: true },
        message: 'Vendor metric tracked successfully'
      });

    } catch (error) {
      console.error('Track vendor metric error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: 'Failed to track vendor metric',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/performance
 * @desc Get system performance analytics
 * @access Private (Admin only)
 */
router.get('/performance',
  authenticateToken,
  requireRole(['admin']),
  validateRequest({ query: timeRangeSchema }),
  async (req, res) => {
    try {
      const { timeRange } = req.query;

      const analytics = await analyticsService.getPerformanceAnalytics(timeRange);

      res.json({
        success: true,
        data: analytics,
        message: 'Performance analytics retrieved successfully'
      });

    } catch (error) {
      console.error('Get performance analytics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve performance analytics',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/analytics/performance/track
 * @desc Track performance metric
 * @access Private (System use)
 */
router.post('/performance/track',
  authenticateToken,
  requireRole(['admin', 'system']),
  validateRequest({ body: performanceTrackingSchema }),
  async (req, res) => {
    try {
      const { endpoint, method, responseTime, statusCode, errorMessage } = req.body;
      const userId = req.user.id;

      await analyticsService.trackPerformance(
        endpoint,
        method,
        responseTime,
        statusCode,
        userId,
        errorMessage
      );

      res.json({
        success: true,
        data: { tracked: true },
        message: 'Performance metric tracked successfully'
      });

    } catch (error) {
      console.error('Track performance error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: 'Failed to track performance metric',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/business
 * @desc Get business metrics
 * @access Private (Admin only)
 */
router.get('/business',
  authenticateToken,
  requireRole(['admin']),
  validateRequest({ 
    query: timeRangeSchema.keys({
      metrics: Joi.array().items(Joi.string()).optional()
    })
  }),
  async (req, res) => {
    try {
      const { timeRange, metrics } = req.query;
      const metricNames = metrics ? metrics.split(',') : [];

      const analytics = await analyticsService.getBusinessMetrics(timeRange, metricNames);

      res.json({
        success: true,
        data: analytics,
        message: 'Business metrics retrieved successfully'
      });

    } catch (error) {
      console.error('Get business metrics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve business metrics',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Get dashboard summary data
 * @access Private
 */
router.get('/dashboard',
  authenticateToken,
  validateRequest({ query: timeRangeSchema }),
  async (req, res) => {
    try {
      const { timeRange } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      let dashboardData = {};

      if (userRole === 'consumer') {
        // Consumer dashboard data
        const userAnalytics = await analyticsService.getUserAnalytics(userId, timeRange);
        dashboardData = {
          type: 'consumer',
          userAnalytics,
          summary: {
            totalSessions: userAnalytics.summary?.totalSessions || 0,
            totalEvents: userAnalytics.summary?.totalEvents || 0,
            avgSessionDuration: userAnalytics.summary?.avgSessionDuration || 0,
            engagementScore: userAnalytics.engagement?.retentionRate || 0
          }
        };
      } else if (userRole === 'vendor') {
        // Vendor dashboard data
        const vendorAnalytics = await analyticsService.getVendorAnalytics(req.user.vendorId, timeRange);
        dashboardData = {
          type: 'vendor',
          vendorAnalytics,
          summary: {
            avgRating: vendorAnalytics.summary?.avgRating || 0,
            totalRatings: vendorAnalytics.summary?.totalRatings || 0,
            acceptanceRate: vendorAnalytics.summary?.invitationAcceptanceRate || 0,
            performanceScore: vendorAnalytics.summary?.performanceScore || 0
          }
        };
      } else if (userRole === 'admin') {
        // Admin dashboard data
        const [performanceAnalytics, businessMetrics] = await Promise.all([
          analyticsService.getPerformanceAnalytics(timeRange),
          analyticsService.getBusinessMetrics(timeRange)
        ]);

        dashboardData = {
          type: 'admin',
          performanceAnalytics,
          businessMetrics,
          summary: {
            totalRequests: performanceAnalytics.summary?.totalRequests || 0,
            avgResponseTime: performanceAnalytics.summary?.avgResponseTime || 0,
            errorRate: performanceAnalytics.summary?.errorRate || 0,
            systemHealth: performanceAnalytics.summary?.errorRate < 1 ? 'healthy' : 'warning'
          }
        };
      }

      res.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });

    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to retrieve dashboard data',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/export
 * @desc Export analytics data
 * @access Private (Admin only)
 */
router.get('/export',
  authenticateToken,
  requireRole(['admin']),
  validateRequest({ 
    query: timeRangeSchema.keys({
      format: Joi.string().valid('json', 'csv').default('json'),
      type: Joi.string().valid('user', 'vendor', 'performance', 'business').required()
    })
  }),
  async (req, res) => {
    try {
      const { timeRange, format, type } = req.query;

      let data;
      switch (type) {
        case 'user':
          data = await analyticsService.getUserAnalytics(req.query.userId, timeRange);
          break;
        case 'vendor':
          data = await analyticsService.getVendorAnalytics(req.query.vendorId, timeRange);
          break;
        case 'performance':
          data = await analyticsService.getPerformanceAnalytics(timeRange);
          break;
        case 'business':
          data = await analyticsService.getBusinessMetrics(timeRange);
          break;
        default:
          throw new Error('Invalid export type');
      }

      if (format === 'csv') {
        // Convert to CSV format
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${timeRange}.csv"`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_analytics_${timeRange}.json"`);
        res.json({
          success: true,
          data,
          exportInfo: {
            type,
            timeRange,
            format,
            exportedAt: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export analytics data',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/analytics/status
 * @desc Get analytics service status
 * @access Private (Admin only)
 */
router.get('/status',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const status = analyticsService.getStatus();

      res.json({
        success: true,
        data: status,
        message: 'Analytics service status retrieved successfully'
      });

    } catch (error) {
      console.error('Get analytics status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: 'Failed to retrieve analytics status',
          details: error.message
        }
      });
    }
  }
);

// Helper function to convert data to CSV
function convertToCSV(data) {
  // Simple CSV conversion - in production, use a proper CSV library
  if (!data || typeof data !== 'object') {
    return '';
  }

  const headers = Object.keys(data);
  const csvHeaders = headers.join(',');
  
  // This is a simplified implementation
  // In production, you'd want to handle nested objects and arrays properly
  const csvData = JSON.stringify(data);
  
  return `${csvHeaders}\n${csvData}`;
}

module.exports = router;
