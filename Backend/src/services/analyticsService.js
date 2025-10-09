/**
 * Analytics Service
 * Comprehensive analytics and reporting system for FixRx
 */

const { dbManager } = require('../config/database');
const { monitoringService } = require('./monitoringService');

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.metrics = {
      users: {},
      vendors: {},
      invitations: {},
      ratings: {},
      performance: {},
      engagement: {}
    };
  }

  async initialize() {
    try {
      console.log('📊 Initializing Analytics Service...');
      
      // Initialize analytics tables if they don't exist
      await this.createAnalyticsTables();
      
      // Start periodic data collection
      this.startPeriodicCollection();
      
      this.isInitialized = true;
      console.log('✅ Analytics Service Initialized');
      
      return { initialized: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Analytics Service Initialization Failed:', error);
      throw error;
    }
  }

  async createAnalyticsTables() {
    const db = dbManager.getDatabase();
    
    // User analytics table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        session_id VARCHAR(255),
        device_info JSONB,
        location_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vendor analytics table
    await db.query(`
      CREATE TABLE IF NOT EXISTS vendor_analytics (
        id SERIAL PRIMARY KEY,
        vendor_id VARCHAR(255) NOT NULL,
        metric_type VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,2),
        metric_data JSONB,
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System performance analytics
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_analytics (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        response_time INTEGER,
        status_code INTEGER,
        user_id VARCHAR(255),
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Business metrics table
    await db.query(`
      CREATE TABLE IF NOT EXISTS business_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,2),
        metric_unit VARCHAR(50),
        dimensions JSONB,
        period_type VARCHAR(20), -- daily, weekly, monthly
        period_date DATE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor_id ON vendor_analytics(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_vendor_analytics_metric_type ON vendor_analytics(metric_type);
      CREATE INDEX IF NOT EXISTS idx_vendor_analytics_timestamp ON vendor_analytics(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_performance_analytics_endpoint ON performance_analytics(endpoint);
      CREATE INDEX IF NOT EXISTS idx_performance_analytics_timestamp ON performance_analytics(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_business_metrics_name ON business_metrics(metric_name);
      CREATE INDEX IF NOT EXISTS idx_business_metrics_period ON business_metrics(period_date);
    `);
  }

  startPeriodicCollection() {
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5 * 60 * 1000);

    // Collect business metrics every hour
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60 * 60 * 1000);

    // Generate daily reports at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.generateDailyReport();
      }
    }, 60 * 1000);
  }

  // User Analytics Methods
  async trackUserEvent(userId, eventType, eventData = {}, sessionId = null, deviceInfo = {}, locationData = {}) {
    try {
      const db = dbManager.getDatabase();
      
      await db.query(`
        INSERT INTO user_analytics (user_id, event_type, event_data, session_id, device_info, location_data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, eventType, JSON.stringify(eventData), sessionId, JSON.stringify(deviceInfo), JSON.stringify(locationData)]);

      // Update real-time metrics
      this.updateUserMetrics(userId, eventType, eventData);
      
    } catch (error) {
      console.error('Failed to track user event:', error);
    }
  }

  async getUserAnalytics(userId, timeRange = '30d') {
    try {
      const db = dbManager.getDatabase();
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Get user events
      const events = await db.query(`
        SELECT event_type, COUNT(*) as count, 
               DATE_TRUNC('day', timestamp) as date
        FROM user_analytics 
        WHERE user_id = $1 AND timestamp >= $2
        GROUP BY event_type, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC
      `, [userId, timeFilter]);

      // Get session data
      const sessions = await db.query(`
        SELECT session_id, MIN(timestamp) as session_start, 
               MAX(timestamp) as session_end,
               COUNT(*) as events_count
        FROM user_analytics 
        WHERE user_id = $1 AND timestamp >= $2 AND session_id IS NOT NULL
        GROUP BY session_id
        ORDER BY session_start DESC
      `, [userId, timeFilter]);

      // Calculate engagement metrics
      const engagement = await this.calculateUserEngagement(userId, timeRange);

      return {
        userId,
        timeRange,
        events: events.rows,
        sessions: sessions.rows,
        engagement,
        summary: {
          totalEvents: events.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          totalSessions: sessions.rows.length,
          avgSessionDuration: this.calculateAvgSessionDuration(sessions.rows),
          mostActiveDay: this.findMostActiveDay(events.rows)
        }
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  // Vendor Analytics Methods
  async trackVendorMetric(vendorId, metricType, metricValue, metricData = {}, periodStart = null, periodEnd = null) {
    try {
      const db = dbManager.getDatabase();
      
      await db.query(`
        INSERT INTO vendor_analytics (vendor_id, metric_type, metric_value, metric_data, period_start, period_end)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vendorId, metricType, metricValue, JSON.stringify(metricData), periodStart, periodEnd]);

      // Update vendor metrics cache
      this.updateVendorMetrics(vendorId, metricType, metricValue);
      
    } catch (error) {
      console.error('Failed to track vendor metric:', error);
    }
  }

  async getVendorAnalytics(vendorId, timeRange = '30d') {
    try {
      const db = dbManager.getDatabase();
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Get vendor metrics
      const metrics = await db.query(`
        SELECT metric_type, AVG(metric_value) as avg_value, 
               COUNT(*) as data_points,
               DATE_TRUNC('day', timestamp) as date
        FROM vendor_analytics 
        WHERE vendor_id = $1 AND timestamp >= $2
        GROUP BY metric_type, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC
      `, [vendorId, timeFilter]);

      // Get ratings analytics
      const ratings = await db.query(`
        SELECT AVG(cost_rating) as avg_cost,
               AVG(quality_rating) as avg_quality,
               AVG(timeliness_rating) as avg_timeliness,
               AVG(professionalism_rating) as avg_professionalism,
               COUNT(*) as total_ratings
        FROM ratings 
        WHERE vendor_id = $1 AND created_at >= $2
      `, [vendorId, timeFilter]);

      // Get invitation analytics
      const invitations = await db.query(`
        SELECT status, COUNT(*) as count
        FROM invitations 
        WHERE vendor_id = $1 AND created_at >= $2
        GROUP BY status
      `, [vendorId, timeFilter]);

      // Calculate performance trends
      const trends = await this.calculateVendorTrends(vendorId, timeRange);

      return {
        vendorId,
        timeRange,
        metrics: metrics.rows,
        ratings: ratings.rows[0] || {},
        invitations: invitations.rows,
        trends,
        summary: {
          avgRating: ratings.rows[0]?.avg_quality || 0,
          totalRatings: parseInt(ratings.rows[0]?.total_ratings || 0),
          invitationAcceptanceRate: this.calculateAcceptanceRate(invitations.rows),
          performanceScore: this.calculatePerformanceScore(metrics.rows, ratings.rows[0])
        }
      };
    } catch (error) {
      console.error('Failed to get vendor analytics:', error);
      throw error;
    }
  }

  // System Performance Analytics
  async trackPerformance(endpoint, method, responseTime, statusCode, userId = null, errorMessage = null) {
    try {
      const db = dbManager.getDatabase();
      
      await db.query(`
        INSERT INTO performance_analytics (endpoint, method, response_time, status_code, user_id, error_message)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [endpoint, method, responseTime, statusCode, userId, errorMessage]);

      // Update performance metrics
      this.updatePerformanceMetrics(endpoint, responseTime, statusCode);
      
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  async getPerformanceAnalytics(timeRange = '24h') {
    try {
      const db = dbManager.getDatabase();
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Get endpoint performance
      const endpoints = await db.query(`
        SELECT endpoint, method,
               AVG(response_time) as avg_response_time,
               MIN(response_time) as min_response_time,
               MAX(response_time) as max_response_time,
               COUNT(*) as total_requests,
               COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM performance_analytics 
        WHERE timestamp >= $1
        GROUP BY endpoint, method
        ORDER BY total_requests DESC
      `, [timeFilter]);

      // Get error analysis
      const errors = await db.query(`
        SELECT status_code, COUNT(*) as count,
               error_message
        FROM performance_analytics 
        WHERE timestamp >= $1 AND status_code >= 400
        GROUP BY status_code, error_message
        ORDER BY count DESC
      `, [timeFilter]);

      // Get hourly performance trends
      const trends = await db.query(`
        SELECT DATE_TRUNC('hour', timestamp) as hour,
               AVG(response_time) as avg_response_time,
               COUNT(*) as request_count,
               COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM performance_analytics 
        WHERE timestamp >= $1
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour DESC
      `, [timeFilter]);

      return {
        timeRange,
        endpoints: endpoints.rows,
        errors: errors.rows,
        trends: trends.rows,
        summary: {
          totalRequests: endpoints.rows.reduce((sum, row) => sum + parseInt(row.total_requests), 0),
          avgResponseTime: this.calculateOverallAvgResponseTime(endpoints.rows),
          errorRate: this.calculateErrorRate(endpoints.rows),
          slowestEndpoint: this.findSlowestEndpoint(endpoints.rows)
        }
      };
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      throw error;
    }
  }

  // Business Metrics
  async collectBusinessMetrics() {
    try {
      const db = dbManager.getDatabase();
      const today = new Date().toISOString().split('T')[0];
      
      // Daily active users
      const dau = await db.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_analytics 
        WHERE DATE(timestamp) = $1
      `, [today]);

      // New user registrations
      const newUsers = await db.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE DATE(created_at) = $1
      `, [today]);

      // New vendor registrations
      const newVendors = await db.query(`
        SELECT COUNT(*) as count
        FROM vendors 
        WHERE DATE(created_at) = $1
      `, [today]);

      // Invitations sent
      const invitationsSent = await db.query(`
        SELECT COUNT(*) as count
        FROM invitations 
        WHERE DATE(created_at) = $1
      `, [today]);

      // Invitations accepted
      const invitationsAccepted = await db.query(`
        SELECT COUNT(*) as count
        FROM invitations 
        WHERE DATE(updated_at) = $1 AND status = 'accepted'
      `, [today]);

      // Ratings submitted
      const ratingsSubmitted = await db.query(`
        SELECT COUNT(*) as count
        FROM ratings 
        WHERE DATE(created_at) = $1
      `, [today]);

      // Store metrics
      const metrics = [
        { name: 'daily_active_users', value: dau.rows[0].count, unit: 'users' },
        { name: 'new_user_registrations', value: newUsers.rows[0].count, unit: 'users' },
        { name: 'new_vendor_registrations', value: newVendors.rows[0].count, unit: 'vendors' },
        { name: 'invitations_sent', value: invitationsSent.rows[0].count, unit: 'invitations' },
        { name: 'invitations_accepted', value: invitationsAccepted.rows[0].count, unit: 'invitations' },
        { name: 'ratings_submitted', value: ratingsSubmitted.rows[0].count, unit: 'ratings' }
      ];

      for (const metric of metrics) {
        await db.query(`
          INSERT INTO business_metrics (metric_name, metric_value, metric_unit, period_type, period_date)
          VALUES ($1, $2, $3, 'daily', $4)
          ON CONFLICT (metric_name, period_date) DO UPDATE SET
          metric_value = EXCLUDED.metric_value,
          timestamp = CURRENT_TIMESTAMP
        `, [metric.name, metric.value, metric.unit, today]);
      }

      console.log('✅ Business metrics collected for', today);
    } catch (error) {
      console.error('Failed to collect business metrics:', error);
    }
  }

  async getBusinessMetrics(timeRange = '30d', metricNames = []) {
    try {
      const db = dbManager.getDatabase();
      const timeFilter = this.getTimeFilter(timeRange);
      
      let query = `
        SELECT metric_name, metric_value, metric_unit, period_date
        FROM business_metrics 
        WHERE period_date >= $1
      `;
      
      const params = [timeFilter.toISOString().split('T')[0]];
      
      if (metricNames.length > 0) {
        query += ` AND metric_name = ANY($2)`;
        params.push(metricNames);
      }
      
      query += ` ORDER BY period_date DESC, metric_name`;
      
      const metrics = await db.query(query, params);

      // Group by metric name
      const groupedMetrics = {};
      metrics.rows.forEach(row => {
        if (!groupedMetrics[row.metric_name]) {
          groupedMetrics[row.metric_name] = [];
        }
        groupedMetrics[row.metric_name].push({
          value: parseFloat(row.metric_value),
          unit: row.metric_unit,
          date: row.period_date
        });
      });

      return {
        timeRange,
        metrics: groupedMetrics,
        summary: this.calculateBusinessSummary(groupedMetrics)
      };
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      throw error;
    }
  }

  // Helper Methods
  getTimeFilter(timeRange) {
    const now = new Date();
    const ranges = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return ranges[timeRange] || ranges['30d'];
  }

  updateUserMetrics(userId, eventType, eventData) {
    if (!this.metrics.users[userId]) {
      this.metrics.users[userId] = { events: {}, lastActivity: new Date() };
    }
    
    if (!this.metrics.users[userId].events[eventType]) {
      this.metrics.users[userId].events[eventType] = 0;
    }
    
    this.metrics.users[userId].events[eventType]++;
    this.metrics.users[userId].lastActivity = new Date();
  }

  updateVendorMetrics(vendorId, metricType, metricValue) {
    if (!this.metrics.vendors[vendorId]) {
      this.metrics.vendors[vendorId] = {};
    }
    
    if (!this.metrics.vendors[vendorId][metricType]) {
      this.metrics.vendors[vendorId][metricType] = [];
    }
    
    this.metrics.vendors[vendorId][metricType].push({
      value: metricValue,
      timestamp: new Date()
    });
    
    // Keep only last 100 values
    if (this.metrics.vendors[vendorId][metricType].length > 100) {
      this.metrics.vendors[vendorId][metricType] = 
        this.metrics.vendors[vendorId][metricType].slice(-100);
    }
  }

  updatePerformanceMetrics(endpoint, responseTime, statusCode) {
    if (!this.metrics.performance[endpoint]) {
      this.metrics.performance[endpoint] = {
        responseTimes: [],
        statusCodes: {},
        requestCount: 0
      };
    }
    
    this.metrics.performance[endpoint].responseTimes.push(responseTime);
    this.metrics.performance[endpoint].requestCount++;
    
    if (!this.metrics.performance[endpoint].statusCodes[statusCode]) {
      this.metrics.performance[endpoint].statusCodes[statusCode] = 0;
    }
    this.metrics.performance[endpoint].statusCodes[statusCode]++;
    
    // Keep only last 1000 response times
    if (this.metrics.performance[endpoint].responseTimes.length > 1000) {
      this.metrics.performance[endpoint].responseTimes = 
        this.metrics.performance[endpoint].responseTimes.slice(-1000);
    }
  }

  calculateUserEngagement(userId, timeRange) {
    // Implementation for user engagement calculation
    return {
      sessionCount: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      retentionRate: 0
    };
  }

  calculateVendorTrends(vendorId, timeRange) {
    // Implementation for vendor trend calculation
    return {
      ratingTrend: 'stable',
      invitationTrend: 'increasing',
      performanceTrend: 'improving'
    };
  }

  calculateAcceptanceRate(invitations) {
    const total = invitations.reduce((sum, inv) => sum + parseInt(inv.count), 0);
    const accepted = invitations.find(inv => inv.status === 'accepted')?.count || 0;
    return total > 0 ? (accepted / total * 100).toFixed(2) : 0;
  }

  calculatePerformanceScore(metrics, ratings) {
    // Complex calculation based on various factors
    return 85.5; // Placeholder
  }

  calculateBusinessSummary(metrics) {
    const summary = {};
    
    Object.keys(metrics).forEach(metricName => {
      const values = metrics[metricName];
      if (values.length > 0) {
        const latest = values[0].value;
        const previous = values[1]?.value || latest;
        const change = previous !== 0 ? ((latest - previous) / previous * 100).toFixed(2) : 0;
        
        summary[metricName] = {
          current: latest,
          change: parseFloat(change),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      }
    });
    
    return summary;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      metricsCollected: Object.keys(this.metrics).length,
      lastCollection: new Date().toISOString()
    };
  }
}

module.exports = { analyticsService: new AnalyticsService() };
