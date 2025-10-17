/**
 * Enhanced Monitoring and Metrics
 * Tracks application health, performance, and business metrics
 */

const { logger } = require('./errorHandler');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      apiCalls: {},
      responseTimes: [],
      activeConnections: 0,
      uptime: Date.now()
    };

    this.businessMetrics = {
      userRegistrations: 0,
      magicLinksSent: 0,
      otpsSent: 0,
      ratingsCreated: 0,
      invitationsSent: 0
    };

    // Start periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Track HTTP request
   */
  trackRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }

    // Track API endpoint usage
    const endpoint = `${req.method} ${req.path}`;
    this.metrics.apiCalls[endpoint] = (this.metrics.apiCalls[endpoint] || 0) + 1;

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        endpoint,
        responseTime,
        method: req.method,
        path: req.path,
        query: req.query
      });
    }
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    this.metrics.errors++;
    
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track business metric
   */
  trackBusinessMetric(metric, value = 1, metadata = {}) {
    if (this.businessMetrics.hasOwnProperty(metric)) {
      this.businessMetrics[metric] += value;
    }

    logger.info('Business metric', {
      metric,
      value,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    const p95ResponseTime = this.calculatePercentile(this.metrics.responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(this.metrics.responseTimes, 99);

    return {
      system: {
        uptime: Date.now() - this.metrics.uptime,
        uptimeFormatted: this.formatUptime(Date.now() - this.metrics.uptime),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      http: {
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 
          ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
          : '0%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms',
        p95ResponseTime: Math.round(p95ResponseTime) + 'ms',
        p99ResponseTime: Math.round(p99ResponseTime) + 'ms',
        activeConnections: this.metrics.activeConnections
      },
      business: this.businessMetrics,
      topEndpoints: this.getTopEndpoints(10)
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get top endpoints by usage
   */
  getTopEndpoints(limit = 10) {
    return Object.entries(this.metrics.apiCalls)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    // Log metrics every 5 minutes
    setInterval(() => {
      const metrics = this.getMetrics();
      logger.info('Periodic metrics report', metrics);
    }, 5 * 60 * 1000);
  }

  /**
   * Health check
   */
  async healthCheck() {
    const metrics = this.getMetrics();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.system.uptimeFormatted,
      metrics: {
        requests: metrics.http.totalRequests,
        errors: metrics.http.totalErrors,
        errorRate: metrics.http.errorRate,
        avgResponseTime: metrics.http.avgResponseTime
      }
    };
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

/**
 * Express middleware for request tracking
 */
function requestTrackingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Track when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoringService.trackRequest(req, res, responseTime);
  });

  next();
}

module.exports = {
  monitoringService,
  requestTrackingMiddleware
};
