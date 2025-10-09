/**
 * Database Configuration - PostgreSQL with Connection Pooling
 * Architecture: PostgreSQL 14+ with PgBouncer-style connection pooling
 */

const { Pool } = require('pg');
const { createClient } = require('redis');

// PostgreSQL Connection Pool Configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_db',
  user: process.env.DB_USER || 'fixrx_user',
  password: process.env.DB_PASSWORD || 'fixrx_password',
  
  // Connection Pool Settings (PgBouncer-style)
  max: parseInt(process.env.DB_POOL_MAX) || 100, // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN) || 10,  // Minimum connections
  idle: parseInt(process.env.DB_POOL_IDLE) || 10000, // 10 seconds
  acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000, // 60 seconds
  evict: parseInt(process.env.DB_POOL_EVICT) || 1000, // 1 second
  
  // Performance Settings
  statement_timeout: 30000, // 30 seconds
  query_timeout: 30000,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  
  // SSL Configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Redis Configuration for Caching and Sessions
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('❌ Too many retries on Redis. Connection Terminated');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 5000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
  
  // Performance Settings
  maxmemory_policy: 'allkeys-lru',
  prefix: 'fixrx:',
  
  // TLS Configuration
  tls: process.env.REDIS_TLS === 'true' ? {
    rejectUnauthorized: false // Only for self-signed certificates in development
  } : undefined
};

class DatabaseManager {
  constructor() {
    this.pgPool = null;
    this.redisClient = null;
    this.isConnected = false;
    this.redisReconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async initialize() {
    try {
      // Initialize PostgreSQL Pool
      this.pgPool = new Pool(pgConfig);
      
      // Test PostgreSQL connection
      const client = await this.pgPool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ PostgreSQL Connected:', {
        timestamp: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0],
        poolSize: pgConfig.max
      });
      client.release();

      // Initialize Redis Client with v4+ syntax
      this.redisClient = createClient(redisConfig);
      
      // Setup Redis event listeners
      await this.setupRedisEventListeners();
      
      try {
        // Connect to Redis
        await this.redisClient.connect();
        
        // Test Redis connection
        await this.redisClient.set('health_check', 'ok', { EX: 60 });
        const health = await this.redisClient.get('health_check');
        
        console.log('✅ Redis Connected:', {
          host: redisConfig.socket.host,
          port: redisConfig.socket.port,
          db: redisConfig.database,
          status: health === 'ok' ? 'healthy' : 'unhealthy'
        });
        
        this.isConnected = true;
      } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        throw error;
      }
      const healthCheck = await this.redisClient.get('health_check');
      
      if (healthCheck === 'ok') {
        console.log('✅ Redis Health Check: Passed');
      }

      this.isConnected = true;
      
      // Setup connection monitoring
      this.setupMonitoring();
      
      return {
        postgresql: true,
        redis: true,
        poolSize: pgConfig.max,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Database Initialization Failed:', error);
      throw error;
    }
  }

  setupMonitoring() {
    // PostgreSQL Pool Monitoring
    this.pgPool.on('connect', (client) => {
      console.log('📊 PostgreSQL: New client connected');
    });

    this.pgPool.on('remove', (client) => {
      console.log('📊 PostgreSQL: Client removed from pool');
    });

    this.pgPool.on('error', (err, client) => {
      console.error('❌ PostgreSQL Pool Error:', err);
    });

    // Periodic health checks
    setInterval(async () => {
      try {
        const poolStats = {
          totalCount: this.pgPool.totalCount,
          idleCount: this.pgPool.idleCount,
          waitingCount: this.pgPool.waitingCount
        };
        
        console.log('📊 PostgreSQL Pool Stats:', poolStats);
        
        // Redis health check
        const redisInfo = await this.redisClient.info('memory');
        console.log('📊 Redis Memory Usage:', redisInfo.split('\n')[1]);
        
      } catch (error) {
      }
    }, 60000); // Every minute
  }

  // PostgreSQL Query Methods
  // Setup Redis event listeners
  async setupRedisEventListeners() {
    if (!this.redisClient) return;

    this.redisClient.on('connect', () => {
      console.log('🔄 Redis connection established');
      this.redisReconnectAttempts = 0; // Reset counter on successful connection
    });

    this.redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
      this.isConnected = true;
    });

    this.redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
      this.isConnected = false;
      
      // Implement reconnection logic
      if (this.redisReconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.redisReconnectAttempts), 15000);
        console.log(`⏳ Attempting to reconnect to Redis (${this.redisReconnectAttempts + 1}/${this.maxReconnectAttempts}) in ${delay}ms...`);
        
        setTimeout(async () => {
          this.redisReconnectAttempts++;
          try {
            await this.redisClient.connect();
          } catch (reconnectError) {
            console.error('❌ Redis reconnection failed:', reconnectError);
          }
        }, delay);
      } else {
        console.error('❌ Max Redis reconnection attempts reached');
        // Consider implementing a fallback mechanism here
      }
    });

    this.redisClient.on('end', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  // Enhanced Redis methods with better error handling and type safety
  async setCache(key, value, ttl = 3600) {
    if (!this.redisClient || !this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }
    
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const options = ttl > 0 ? { EX: ttl } : undefined;
      return await this.redisClient.set(key, serialized, options);
    } catch (error) {
      console.error('Redis setCache error:', error);
      return false;
    }
  }

  async getCache(key, parseJson = true) {
    if (!this.redisClient || !this.isConnected) {
      console.warn('Redis not connected, cache miss');
      return null;
    }
    
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return parseJson ? JSON.parse(data) : data;
    } catch (error) {
      console.error('Redis getCache error:', error);
      return null;
    }
  }

  async deleteCache(key) {
    if (!this.redisClient || !this.isConnected) {
      console.warn('Redis not connected, cannot delete cache');
      return false;
    }
    
    try {
      return await this.redisClient.del(key) > 0;
    } catch (error) {
      console.error('Redis deleteCache error:', error);
      return false;
    }
  }

  async flushCache(pattern = '*') {
    if (!this.redisClient || !this.isConnected) {
      console.warn('Redis not connected, cannot flush cache');
      return false;
    }
    
    try {
      if (pattern === '*') {
        await this.redisClient.flushDb();
      } else {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
      return true;
    } catch (error) {
      console.error('Redis flushCache error:', error);
      return false;
    }
  }

  // Database query method
  async query(text, params = []) {
    const start = Date.now();
    try {
      const res = await this.pgPool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error', { error, query: text, params });
      throw error;
    }
  }

  async close() {
    if (this.pgPool) {
      try {
        await this.pgPool.end();
        console.log('PostgreSQL connection pool closed');
      } catch (error) {
        console.error('Error closing PostgreSQL pool:', error);
      }
    }
    
    if (this.redisClient) {
      try {
        // Remove all listeners to prevent memory leaks
        this.redisClient.removeAllListeners();
        // Gracefully close the connection
        await this.redisClient.quit();
        console.log('Redis connection closed gracefully');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
        // Forcefully disconnect if quit fails
        try {
          await this.redisClient.disconnect();
          console.log('Redis connection force-closed');
        } catch (e) {
          console.error('Error force-closing Redis:', e);
        }
      }
    }
    
    this.isConnected = false;
  }

  getStatus() {
    return {
      postgresql: !!this.pgPool,
      redis: this.isConnected,
      poolStats: this.pgPool ? {
        totalCount: this.pgPool.totalCount,
        idleCount: this.pgPool.idleCount,
        waitingCount: this.pgPool.waitingCount
      } : null
    };
  }
}

// Create a singleton instance
const dbManager = new DatabaseManager();

// Export the class, instance, and configs
module.exports = {
  DatabaseManager: DatabaseManager,
  dbManager: dbManager,
  pgConfig: pgConfig,
  redisConfig: redisConfig,
};
