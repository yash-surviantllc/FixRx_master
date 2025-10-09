const { createClient } = require('redis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Starting Redis connection test...');
console.log(`🔌 Attempting to connect to Redis at ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`);

// Create Redis client with timeout
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    connectTimeout: 3000, // 3 seconds timeout
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Set timeout for the whole test
const TEST_TIMEOUT = 5000; // 5 seconds

// Error handler
redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
  process.exit(1);
});

// Test connection
async function testRedisConnection() {
  try {
    console.log('🔄 Connecting to Redis...');
    await redisClient.connect();
    
    console.log('✅ Successfully connected to Redis!');
    
    // Test basic operations
    console.log('🧪 Testing basic operations...');
    await redisClient.set('test:connection', 'success');
    const value = await redisClient.get('test:connection');
    console.log(`📝 Test key value: ${value}`);
    
    // Clean up
    await redisClient.del('test:connection');
    
    console.log('✨ All tests passed! Redis is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await redisClient.quit();
  }
}

// Set timeout for the test
const timeout = setTimeout(() => {
  console.error('❌ Test timed out after 5 seconds. Redis server might not be responding.');
  process.exit(1);
}, TEST_TIMEOUT);

// Run the test
testRedisConnection().finally(() => {
  clearTimeout(timeout);
});
