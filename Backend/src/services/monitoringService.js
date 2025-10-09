/**
 * Monitoring and Observability Service
 * Architecture: Application monitoring, performance tracking, business metrics
 */

const { dbManager } = require('../config/database');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      performance: new Map(),
      business: new Map()
    };
    this.isInitialized = false;
    this.alertThresholds = {
      errorRate: 0.05, // 5%
      responseTime: 1000, // 1 second
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.80 // 80%
    };
  }

  async initialize() {
    try {
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
      // Initialize alert system
      this.initializeAlerts();
      
      this.isInitialized = true;
      console.log('✅ Monitoring Service Initialized');

      return {
        initialized: true,
        thresholds: this.alertThresholds,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Monitoring Service Initialization Failed:', error);
      throw error;
    }
  }

  // Application Monitoring
  async trackRequest(requestData) {
    const { method, path, statusCode, duration, userId, ip } = requestData;
    
    try {
      const timestamp = new Date().toISOString();
      const hour = timestamp.substring(0, 13);
      
      // Track request metrics
      const requestKey = `requests:${hour}`;
      const currentMetrics = await dbManager.getCache(requestKey) || {
        total: 0,
        byMethod: {},
        byStatus: {},
        totalDuration: 0,
        errors: 0,
        uniqueUsers: new Set(),
        uniqueIPs: new Set()
      };

      currentMetrics.total++;
      currentMetrics.byMethod[method] = (currentMetrics.byMethod[method] || 0) + 1;
      currentMetrics.byStatus[statusCode] = (currentMetrics.byStatus[statusCode] || 0) + 1;
      currentMetrics.totalDuration += duration;
      
      if (statusCode >= 400) {
        currentMetrics.errors++;
      }
      
      if (userId) currentMetrics.uniqueUsers.add(userId);
      if (ip) currentMetrics.uniqueIPs.add(ip);

      // Convert Sets to arrays for storage
      const metricsToStore = {
        ...currentMetrics,
        uniqueUsers: Array.from(currentMetrics.uniqueUsers),
        uniqueIPs: Array.from(currentMetrics.uniqueIPs)
      };

      await dbManager.setCache(requestKey, metricsToStore, 3600);

      // Check for alerts
      this.checkPerformanceAlerts(currentMetrics, duration, statusCode);

    } catch (error) {
      console.error('❌ Request Tracking Failed:', error);
    }
  }

  // Error Tracking
  async trackError(errorData) {
    const { error, request, user, severity = 'error' } = errorData;
    
    try {
      const errorEntry = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        code: error.code || 'UNKNOWN_ERROR',
        severity,
        request: {
          method: request?.method,
          path: request?.path,
          ip: request?.ip,
          userAgent: request?.userAgent
        },
        user: {
          id: user?.id,
          role: user?.role
        },
        environment: process.env.NODE_ENV || 'development'
      };

      // Store error details
      await dbManager.setCache(`error:${errorEntry.id}`, errorEntry, 86400);

      // Update error statistics
      const hour = errorEntry.timestamp.substring(0, 13);
      const errorStatsKey = `error_stats:${hour}`;
      const errorStats = await dbManager.getCache(errorStatsKey) || {
        total: 0,
        bySeverity: {},
        byCode: {},
        byPath: {}
      };

      errorStats.total++;
      errorStats.bySeverity[severity] = (errorStats.bySeverity[severity] || 0) + 1;
      errorStats.byCode[errorEntry.code] = (errorStats.byCode[errorEntry.code] || 0) + 1;
      
      if (request?.path) {
        errorStats.byPath[request.path] = (errorStats.byPath[request.path] || 0) + 1;
      }

      await dbManager.setCache(errorStatsKey, errorStats, 3600);

      // Send alert for critical errors
      if (severity === 'critical') {
        await this.sendAlert('critical_error', errorEntry);
      }

      console.error('📊 Error Tracked:', {
        id: errorEntry.id,
        code: errorEntry.code,
        severity,
        path: request?.path
      });

    } catch (trackingError) {
      console.error('❌ Error Tracking Failed:', trackingError);
    }
  }

  // Performance Monitoring
  async trackPerformance(performanceData) {
    const { 
      endpoint, 
      duration, 
      dbQueryTime, 
      cacheHitRate, 
      memoryUsage, 
      cpuUsage 
    } = performanceData;

    try {
      const timestamp = new Date().toISOString();
      const minute = timestamp.substring(0, 16);
      
      const perfKey = `performance:${minute}`;
      const perfMetrics = await dbManager.getCache(perfKey) || {
        endpoints: {},
        system: {
          avgMemory: 0,
          avgCpu: 0,
          samples: 0
        },
        database: {
          avgQueryTime: 0,
          queries: 0
        },
        cache: {
          hits: 0,
          misses: 0
        }
      };

      // Track endpoint performance
      if (endpoint && duration) {
        if (!perfMetrics.endpoints[endpoint]) {
          perfMetrics.endpoints[endpoint] = {
            requests: 0,
            totalDuration: 0,
            minDuration: duration,
            maxDuration: duration
          };
        }

        const endpointMetrics = perfMetrics.endpoints[endpoint];
        endpointMetrics.requests++;
        endpointMetrics.totalDuration += duration;
        endpointMetrics.minDuration = Math.min(endpointMetrics.minDuration, duration);
        endpointMetrics.maxDuration = Math.max(endpointMetrics.maxDuration, duration);
      }

      // Track system performance
      if (memoryUsage !== undefined || cpuUsage !== undefined) {
        const systemMetrics = perfMetrics.system;
        systemMetrics.samples++;
        
        if (memoryUsage !== undefined) {
          systemMetrics.avgMemory = ((systemMetrics.avgMemory * (systemMetrics.samples - 1)) + memoryUsage) / systemMetrics.samples;
        }
        
        if (cpuUsage !== undefined) {
          systemMetrics.avgCpu = ((systemMetrics.avgCpu * (systemMetrics.samples - 1)) + cpuUsage) / systemMetrics.samples;
        }
      }

      // Track database performance
      if (dbQueryTime !== undefined) {
        const dbMetrics = perfMetrics.database;
        dbMetrics.queries++;
        dbMetrics.avgQueryTime = ((dbMetrics.avgQueryTime * (dbMetrics.queries - 1)) + dbQueryTime) / dbMetrics.queries;
      }

      // Track cache performance
      if (cacheHitRate !== undefined) {
        if (cacheHitRate > 0) {
          perfMetrics.cache.hits++;
        } else {
          perfMetrics.cache.misses++;
        }
      }

      await dbManager.setCache(perfKey, perfMetrics, 3600);

      // Check performance alerts
      this.checkSystemAlerts(perfMetrics.system);

    } catch (error) {
      console.error('❌ Performance Tracking Failed:', error);
    }
  }

  // Business Metrics Tracking
  async trackBusinessMetric(metricName, value, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      const day = timestamp.substring(0, 10);
      
      const businessKey = `business:${day}:${metricName}`;
      const businessMetrics = await dbManager.getCache(businessKey) || {
        total: 0,
        count: 0,
        min: value,
        max: value,
        metadata: {}
      };

      businessMetrics.total += value;
      businessMetrics.count++;
      businessMetrics.min = Math.min(businessMetrics.min, value);
      businessMetrics.max = Math.max(businessMetrics.max, value);
      
      // Merge metadata
      Object.assign(businessMetrics.metadata, metadata);

      await dbManager.setCache(businessKey, businessMetrics, 86400);

      console.log('📊 Business Metric Tracked:', {
        metric: metricName,
        value,
        average: businessMetrics.total / businessMetrics.count
      });

    } catch (error) {
      console.error('❌ Business Metric Tracking Failed:', error);
    }
  }

  // User Analytics
  async trackUserActivity(userId, activity, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      const hour = timestamp.substring(0, 13);
      
      const activityKey = `user_activity:${hour}`;
      const activityMetrics = await dbManager.getCache(activityKey) || {
        totalUsers: new Set(),
        activities: {},
        byUserType: {}
      };

      activityMetrics.totalUsers.add(userId);
      activityMetrics.activities[activity] = (activityMetrics.activities[activity] || 0) + 1;
      
      if (metadata.userType) {
        activityMetrics.byUserType[metadata.userType] = (activityMetrics.byUserType[metadata.userType] || 0) + 1;
      }

      // Convert Set to array for storage
      const metricsToStore = {
        ...activityMetrics,
        totalUsers: Array.from(activityMetrics.totalUsers)
      };

      await dbManager.setCache(activityKey, metricsToStore, 3600);

    } catch (error) {
      console.error('❌ User Activity Tracking Failed:', error);
    }
  }

  // Alert System
  checkPerformanceAlerts(metrics, duration, statusCode) {
    // Check error rate
    const errorRate = metrics.errors / metrics.total;
    if (errorRate > this.alertThresholds.errorRate) {
      this.sendAlert('high_error_rate', {
        errorRate: (errorRate * 100).toFixed(2),
        threshold: (this.alertThresholds.errorRate * 100).toFixed(2)
      });
    }

    // Check response time
    if (duration > this.alertThresholds.responseTime) {
      this.sendAlert('slow_response', {
        duration,
        threshold: this.alertThresholds.responseTime
      });
    }
  }

  checkSystemAlerts(systemMetrics) {
    // Check memory usage
    if (systemMetrics.avgMemory > this.alertThresholds.memoryUsage) {
      this.sendAlert('high_memory_usage', {
        usage: (systemMetrics.avgMemory * 100).toFixed(2),
        threshold: (this.alertThresholds.memoryUsage * 100).toFixed(2)
      });
    }

    // Check CPU usage
    if (systemMetrics.avgCpu > this.alertThresholds.cpuUsage) {
      this.sendAlert('high_cpu_usage', {
        usage: (systemMetrics.avgCpu * 100).toFixed(2),
        threshold: (this.alertThresholds.cpuUsage * 100).toFixed(2)
      });
    }
  }

  async sendAlert(alertType, data) {
    try {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: alertType,
        severity: this.getAlertSeverity(alertType),
        timestamp: new Date().toISOString(),
        data,
        environment: process.env.NODE_ENV || 'development'
      };

      // Store alert
      await dbManager.setCache(`alert:${alert.id}`, alert, 86400);

      // Log alert
      console.warn('🚨 ALERT:', {
        type: alertType,
        severity: alert.severity,
        data
      });

      // In production, send to external monitoring service
      // await this.sendToExternalMonitoring(alert);

    } catch (error) {
      console.error('❌ Alert Sending Failed:', error);
    }
  }

  getAlertSeverity(alertType) {
    const severityMap = {
      critical_error: 'critical',
      high_error_rate: 'high',
      slow_response: 'medium',
      high_memory_usage: 'medium',
      high_cpu_usage: 'medium',
      database_connection_failed: 'high',
      external_service_down: 'medium'
    };

    return severityMap[alertType] || 'low';
  }

  // Periodic Monitoring
  startPeriodicMonitoring() {
    // System metrics every minute
    setInterval(async () => {
      try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        await this.trackPerformance({
          memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
          cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to seconds
        });

      } catch (error) {
        console.error('❌ System Monitoring Failed:', error);
      }
    }, 60000); // Every minute

    // Database health check every 5 minutes
    setInterval(async () => {
      try {
        const start = Date.now();
        await dbManager.query('SELECT 1');
        const dbQueryTime = Date.now() - start;
        
        await this.trackPerformance({ dbQueryTime });

        if (dbQueryTime > 1000) { // > 1 second
          await this.sendAlert('slow_database', { queryTime: dbQueryTime });
        }

      } catch (error) {
        await this.sendAlert('database_connection_failed', { error: error.message });
      }
    }, 300000); // Every 5 minutes

    // Cleanup old metrics every hour
    setInterval(async () => {
      await this.cleanupOldMetrics();
    }, 3600000); // Every hour
  }

  initializeAlerts() {
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      await this.trackError({
        error,
        severity: 'critical',
        request: { path: 'uncaught_exception' }
      });
      
      console.error('💥 Uncaught Exception:', error);
      // Don't exit in production, log and continue
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      await this.trackError({
        error: new Error(`Unhandled Rejection: ${reason}`),
        severity: 'high',
        request: { path: 'unhandled_rejection' }
      });
      
      console.error('💥 Unhandled Rejection:', reason);
    });
  }

  // Metrics Retrieval
  async getMetrics(timeRange = '1h') {
    try {
      const now = new Date();
      const ranges = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      };

      const hours = ranges[timeRange] || 1;
      const metrics = {
        requests: {},
        errors: {},
        performance: {},
        business: {},
        alerts: []
      };

      // Collect metrics for the time range
      for (let i = 0; i < hours; i++) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.toISOString().substring(0, 13);
        
        // Request metrics
        const requestMetrics = await dbManager.getCache(`requests:${hour}`);
        if (requestMetrics) {
          metrics.requests[hour] = requestMetrics;
        }

        // Error metrics
        const errorMetrics = await dbManager.getCache(`error_stats:${hour}`);
        if (errorMetrics) {
          metrics.errors[hour] = errorMetrics;
        }

        // Performance metrics (by minute for recent data)
        if (i < 60) { // Last hour in minutes
          for (let j = 0; j < 60; j++) {
            const minute = new Date(time.getTime() - j * 60 * 1000).toISOString().substring(0, 16);
            const perfMetrics = await dbManager.getCache(`performance:${minute}`);
            if (perfMetrics) {
              metrics.performance[minute] = perfMetrics;
            }
          }
        }
      }

      return metrics;

    } catch (error) {
      console.error('❌ Get Metrics Failed:', error);
      throw error;
    }
  }

  async getHealthStatus() {
    try {
      const dbStatus = dbManager.getStatus();
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Get recent error rate
      const hour = new Date().toISOString().substring(0, 13);
      const requestMetrics = await dbManager.getCache(`requests:${hour}`) || { total: 0, errors: 0 };
      const errorRate = requestMetrics.total > 0 ? requestMetrics.errors / requestMetrics.total : 0;

      return {
        status: errorRate < 0.05 && dbStatus.connected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        database: dbStatus,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        performance: {
          errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
          requestsLastHour: requestMetrics.total
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async cleanupOldMetrics() {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const pattern = `metrics:*`;
      
      const deletedCount = await dbManager.flushCache(pattern);
      console.log('🧹 Cleaned up old metrics:', { deletedCount });

    } catch (error) {
      console.error('❌ Metrics Cleanup Failed:', error);
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      thresholds: this.alertThresholds,
      features: {
        requestTracking: true,
        errorTracking: true,
        performanceMonitoring: true,
        businessMetrics: true,
        alerting: true
      }
    };
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

module.exports = {
  MonitoringService,
  monitoringService
};
