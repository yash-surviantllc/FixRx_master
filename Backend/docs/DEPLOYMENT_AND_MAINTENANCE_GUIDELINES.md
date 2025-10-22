# Deployment and Maintenance Guidelines

## 🚀 Production Deployment Guide

This comprehensive guide covers deployment procedures, maintenance protocols, and operational best practices for the FixRx platform.

## 📋 Pre-Deployment Checklist

### Environment Preparation

**1. Infrastructure Requirements**
- [ ] PostgreSQL 14.9+ database server
- [ ] Redis cache server (latest stable)
- [ ] Node.js 18+ runtime environment
- [ ] Load balancer (Nginx/HAProxy)
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] CDN setup for static assets

**2. Security Configuration**
- [ ] Firewall rules configured
- [ ] VPN access for admin operations
- [ ] SSH key-based authentication
- [ ] Database access restrictions
- [ ] API rate limiting configured
- [ ] Security headers implemented

**3. Third-Party Services**
- [ ] Twilio SMS service configured
- [ ] SendGrid email service setup
- [ ] Firebase push notifications ready
- [ ] OAuth providers configured
- [ ] Monitoring services integrated

### Code Preparation

**1. Code Quality Checks**
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run security audit
npm audit

# Run tests
npm test

# Build production bundle
npm run build
```

**2. Environment Variables**
```bash
# Production .env file
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/fixrx_production
REDIS_URL=redis://redis-host:6379
JWT_SECRET=your_super_secure_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SENDGRID_API_KEY=your_sendgrid_key
FIREBASE_PROJECT_ID=your_firebase_project
```

## 🏗️ Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    A[Load Balancer] --> B[App Server 1]
    A --> C[App Server 2]
    A --> D[App Server 3]
    B --> E[PostgreSQL Primary]
    C --> E
    D --> E
    B --> F[Redis Cache]
    C --> F
    D --> F
    E --> G[PostgreSQL Replica]
    H[Backup Storage] --> E
    I[Monitoring] --> B
    I --> C
    I --> D
    I --> E
    I --> F
```

### Deployment Steps

**1. Database Migration**
```bash
# Backup current database
pg_dump fixrx_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run migrate:production

# Verify migration
npm run migrate:status
```

**2. Application Deployment**
```bash
# Clone repository
git clone https://github.com/your-org/fixrx-backend.git
cd fixrx-backend

# Install dependencies
npm ci --production

# Build application
npm run build

# Start application with PM2
pm2 start ecosystem.config.js --env production
```

**3. Health Check Verification**
```bash
# Check application health
curl -f http://localhost:3000/api/v1/system/health

# Check database connectivity
curl -f http://localhost:3000/api/v1/system/database/status

# Verify third-party integrations
curl -f http://localhost:3000/api/v1/system/metrics
```

## 🔧 Configuration Management

### PM2 Process Manager

**ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'fixrx-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: ['server1.fixrx.com', 'server2.fixrx.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/fixrx-backend.git',
      path: '/var/www/fixrx-backend',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### Nginx Load Balancer

**nginx.conf**
```nginx
upstream fixrx_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name api.fixrx.com;

    ssl_certificate /etc/ssl/certs/fixrx.crt;
    ssl_certificate_key /etc/ssl/private/fixrx.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://fixrx_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://fixrx_backend/api/v1/system/health;
    }
}
```

## 📊 Monitoring and Alerting

### Application Monitoring

**1. Health Check Endpoints**
```javascript
// Health monitoring service
class HealthMonitor {
  static async checkSystemHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkThirdPartyServices(),
      this.checkDiskSpace(),
      this.checkMemoryUsage()
    ]);

    return {
      status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
      checks: checks.map(check => ({
        status: check.status,
        value: check.value || check.reason
      }))
    };
  }

  static async checkDatabase() {
    const start = Date.now();
    await db.query('SELECT 1');
    return {
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - start
    };
  }

  static async checkRedis() {
    const start = Date.now();
    await redis.ping();
    return {
      service: 'redis',
      status: 'healthy',
      responseTime: Date.now() - start
    };
  }
}
```

**2. Performance Metrics**
```javascript
// Metrics collection
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active database connections'
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});
```

### Log Management

**1. Structured Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fixrx-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('User logged in', { userId: 'user123', ip: req.ip });
logger.error('Database connection failed', { error: error.message });
```

**2. Log Rotation**
```bash
# logrotate configuration
/var/log/fixrx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 fixrx fixrx
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Alerting Configuration

**1. Alert Rules**
```yaml
# Prometheus alerting rules
groups:
- name: fixrx-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected

  - alert: DatabaseConnectionHigh
    expr: active_connections > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: High database connection usage

  - alert: ResponseTimeHigh
    expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High response time detected
```

## 🔄 Backup and Recovery

### Automated Backup Strategy

**1. Database Backups**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="fixrx_production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME | gzip > $BACKUP_DIR/full_backup_$DATE.sql.gz

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/full_backup_$DATE.sql.gz s3://fixrx-backups/database/

# Clean old local backups (keep 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Log backup completion
echo "$(date): Database backup completed - full_backup_$DATE.sql.gz" >> /var/log/backup.log
```

**2. Application Backups**
```bash
#!/bin/bash
# backup-application.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/application"
APP_DIR="/var/www/fixrx-backend"

# Create backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/app_backup_$DATE.tar.gz s3://fixrx-backups/application/

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

**3. Backup Verification**
```bash
#!/bin/bash
# verify-backup.sh

LATEST_BACKUP=$(ls -t /backups/database/*.sql.gz | head -1)

# Test restore to temporary database
createdb fixrx_test_restore
gunzip -c $LATEST_BACKUP | psql -d fixrx_test_restore

# Verify data integrity
RECORD_COUNT=$(psql -d fixrx_test_restore -t -c "SELECT COUNT(*) FROM users;")

if [ $RECORD_COUNT -gt 0 ]; then
    echo "Backup verification successful: $RECORD_COUNT records found"
else
    echo "Backup verification failed: No records found"
    exit 1
fi

# Cleanup
dropdb fixrx_test_restore
```

### Recovery Procedures

**1. Database Recovery**
```bash
# Point-in-time recovery
pg_restore --clean --if-exists -d fixrx_production backup_file.sql

# Verify recovery
psql -d fixrx_production -c "SELECT COUNT(*) FROM users;"
```

**2. Application Recovery**
```bash
# Stop application
pm2 stop fixrx-api

# Restore from backup
cd /var/www
tar -xzf /backups/application/app_backup_YYYYMMDD_HHMMSS.tar.gz

# Restart application
pm2 start fixrx-api
```

## 🔧 Maintenance Procedures

### Regular Maintenance Tasks

**1. Daily Tasks**
```bash
#!/bin/bash
# daily-maintenance.sh

# Check system health
curl -f http://localhost:3000/api/v1/system/health

# Monitor disk space
df -h | awk '$5 > 80 {print "Warning: " $1 " is " $5 " full"}'

# Check application logs for errors
grep -i error /var/log/fixrx/error.log | tail -10

# Update system packages (if needed)
apt update && apt list --upgradable
```

**2. Weekly Tasks**
```bash
#!/bin/bash
# weekly-maintenance.sh

# Database maintenance
psql -d fixrx_production -c "VACUUM ANALYZE;"

# Clear old logs
find /var/log/fixrx -name "*.log" -mtime +7 -delete

# Update SSL certificates (if needed)
certbot renew --quiet

# Security updates
apt update && apt upgrade -y
```

**3. Monthly Tasks**
```bash
#!/bin/bash
# monthly-maintenance.sh

# Database optimization
psql -d fixrx_production -c "REINDEX DATABASE fixrx_production;"

# Performance analysis
psql -d fixrx_production -c "SELECT * FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 10;"

# Security audit
npm audit
nmap -sS localhost

# Backup verification
./verify-backup.sh
```

### Performance Optimization

**1. Database Optimization**
```sql
-- Analyze query performance
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Optimize slow queries
EXPLAIN ANALYZE SELECT * FROM vendors WHERE service_categories @> ARRAY['plumbing'];
```

**2. Application Optimization**
```javascript
// Connection pool optimization
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// Cache optimization
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});
```

## 🚨 Incident Response

### Incident Classification

**1. Severity Levels**
- **Critical (P1)**: Complete service outage
- **High (P2)**: Major feature unavailable
- **Medium (P3)**: Minor feature issues
- **Low (P4)**: Cosmetic or documentation issues

**2. Response Times**
- **P1**: 15 minutes
- **P2**: 1 hour
- **P3**: 4 hours
- **P4**: Next business day

### Incident Response Procedures

**1. Detection and Alerting**
```bash
# Automated monitoring alerts
# Slack webhook notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 CRITICAL: FixRx API is down!"}' \
  $SLACK_WEBHOOK_URL

# Email notification
echo "FixRx API health check failed" | mail -s "CRITICAL ALERT" ops@fixrx.com
```

**2. Incident Response Checklist**
- [ ] Acknowledge the incident
- [ ] Assess severity and impact
- [ ] Notify stakeholders
- [ ] Begin investigation
- [ ] Implement temporary fix if possible
- [ ] Communicate status updates
- [ ] Implement permanent fix
- [ ] Conduct post-incident review

**3. Communication Templates**
```
INCIDENT NOTIFICATION
Status: INVESTIGATING
Impact: API response times elevated
ETA: Investigating, updates in 30 minutes
Actions: Scaling additional servers

INCIDENT RESOLVED
Status: RESOLVED
Resolution: Database connection pool increased
Duration: 45 minutes
Next Steps: Post-incident review scheduled
```

## 📈 Scaling Guidelines

### Horizontal Scaling

**1. Load Balancer Configuration**
```nginx
# Add new server to upstream
upstream fixrx_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 10.0.1.100:3000;  # New server
}
```

**2. Auto-Scaling Configuration**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fixrx-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fixrx-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling

**1. Read Replicas**
```javascript
// Database connection with read replicas
const masterPool = new Pool({ connectionString: process.env.DATABASE_URL });
const replicaPool = new Pool({ connectionString: process.env.REPLICA_DATABASE_URL });

// Route read queries to replica
function getPool(operation) {
  return operation === 'read' ? replicaPool : masterPool;
}
```

**2. Connection Pooling**
```javascript
// PgBouncer configuration
const poolConfig = {
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

## 📋 Maintenance Schedule

### Scheduled Maintenance Windows

**1. Regular Maintenance**
- **Daily**: 2:00 AM - 2:30 AM UTC (Low traffic period)
- **Weekly**: Sunday 3:00 AM - 4:00 AM UTC
- **Monthly**: First Sunday 2:00 AM - 6:00 AM UTC

**2. Emergency Maintenance**
- Immediate for security patches
- Within 24 hours for critical bugs
- Coordinated with stakeholders

**3. Planned Upgrades**
- Scheduled 2 weeks in advance
- Stakeholder notification required
- Rollback plan prepared

---

*Last updated: October 3, 2024*
*Deployment Guide Version: 1.0.0*
*For operational support: ops@fixrx.com*
