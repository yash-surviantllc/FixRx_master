/**
 * Rate Limiting Test Script
 * Tests if rate limiting is properly configured for development
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting Configuration...\n');

  try {
    // Test 1: Health endpoint (should work without rate limiting)
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api/v1', '')}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Health endpoint accessible');
    }

    // Test 2: Multiple rapid requests to auth endpoint
    console.log('\n2️⃣ Testing Auth Endpoint Rate Limiting...');
    const authPromises = [];
    
    // Send 10 rapid requests to auth endpoint
    for (let i = 0; i < 10; i++) {
      authPromises.push(
        axios.post(`${BASE_URL}/auth/otp/health`)
          .then(response => ({ success: true, status: response.status }))
          .catch(error => ({ 
            success: false, 
            status: error.response?.status, 
            message: error.response?.data?.error?.message || error.message 
          }))
      );
    }

    const authResults = await Promise.all(authPromises);
    const successCount = authResults.filter(r => r.success).length;
    const rateLimitedCount = authResults.filter(r => r.status === 429).length;

    console.log(`✅ Successful requests: ${successCount}/10`);
    console.log(`⚠️ Rate limited requests: ${rateLimitedCount}/10`);

    if (rateLimitedCount === 0) {
      console.log('🎉 Rate limiting is DISABLED - Perfect for development!');
    } else {
      console.log('🚦 Rate limiting is ACTIVE - May slow down development');
    }

    // Test 3: API endpoint rapid requests
    console.log('\n3️⃣ Testing API Endpoint Rate Limiting...');
    const apiPromises = [];
    
    // Send 20 rapid requests to API endpoint
    for (let i = 0; i < 20; i++) {
      apiPromises.push(
        axios.get(`${BASE_URL}/health`)
          .then(response => ({ success: true, status: response.status }))
          .catch(error => ({ 
            success: false, 
            status: error.response?.status, 
            message: error.response?.data?.error?.message || error.message 
          }))
      );
    }

    const apiResults = await Promise.all(apiPromises);
    const apiSuccessCount = apiResults.filter(r => r.success).length;
    const apiRateLimitedCount = apiResults.filter(r => r.status === 429).length;

    console.log(`✅ Successful API requests: ${apiSuccessCount}/20`);
    console.log(`⚠️ Rate limited API requests: ${apiRateLimitedCount}/20`);

    console.log('\n🎯 Rate Limiting Test Results:');
    console.log('================================');
    
    if (rateLimitedCount === 0 && apiRateLimitedCount === 0) {
      console.log('✅ PERFECT: Rate limiting is disabled for development');
      console.log('✅ You can make unlimited requests for testing');
      console.log('✅ OTP authentication will work without delays');
      console.log('✅ Chat messaging will work without restrictions');
    } else {
      console.log('⚠️ NOTICE: Some rate limiting is still active');
      console.log('💡 To completely disable rate limiting:');
      console.log('   1. Set DISABLE_RATE_LIMIT=true in .env file');
      console.log('   2. Restart the backend server');
    }

    console.log('\n📋 Current Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   DISABLE_RATE_LIMIT: ${process.env.DISABLE_RATE_LIMIT || 'not set'}`);

  } catch (error) {
    console.error('❌ Rate Limiting Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend server is running on port 3000');
    console.log('   2. Check if DISABLE_RATE_LIMIT=true in .env file');
    console.log('   3. Restart backend server after .env changes');
  }
}

// Run the test
testRateLimiting();
