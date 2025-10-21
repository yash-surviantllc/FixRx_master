const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3000';
let authToken = null;

console.log('🚀 FixRx Mobile-Backend Integration Test');
console.log('═'.repeat(60));
console.log('');

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test suite
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  console.log('📋 Test 1: Health Check');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      console.log('   ✅ PASS - Backend is healthy');
      results.passed++;
    } else {
      console.log('   ❌ FAIL - Unexpected response');
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ FAIL -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 2: API Health Check
  console.log('📋 Test 2: API v1 Health Check');
  try {
    const response = await makeRequest('GET', '/api/v1/health');
    if (response.statusCode === 200 && response.data.version) {
      console.log('   ✅ PASS - API v1 is healthy (version:', response.data.version + ')');
      results.passed++;
    } else {
      console.log('   ❌ FAIL - Unexpected response');
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ FAIL -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 3: Login (Authentication)
  console.log('📋 Test 3: User Login');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      email: 'john.consumer@example.com',
      password: 'password123'
    });
    
    if (response.statusCode === 200 && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('   ✅ PASS - Login successful');
      console.log('   📝 User:', response.data.data.user.email);
      console.log('   🔑 Token received (length:', authToken.length + ')');
      results.passed++;
    } else {
      console.log('   ❌ FAIL - No token received');
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ FAIL -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 4: User Profile (Authenticated Request)
  console.log('📋 Test 4: Get User Profile (Authenticated)');
  try {
    if (!authToken) {
      console.log('   ⚠️  SKIP - No auth token available');
    } else {
      const response = await makeRequest('GET', '/api/v1/users/profile', null, authToken);
      
      if (response.statusCode === 200) {
        console.log('   ✅ PASS - Profile retrieved successfully');
        if (response.data.data) {
          console.log('   👤 User:', response.data.data.email);
        }
        results.passed++;
      } else {
        console.log('   ❌ FAIL - Status:', response.statusCode);
        console.log('   Error:', response.data.error?.message || 'Unknown error');
        results.failed++;
      }
    }
  } catch (error) {
    console.log('   ❌ FAIL -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 5: Unauthorized Request
  console.log('📋 Test 5: Unauthorized Request (No Token)');
  try {
    const response = await makeRequest('GET', '/api/v1/users/profile');
    
    if (response.statusCode === 401) {
      console.log('   ✅ PASS - Correctly rejected unauthorized request');
      results.passed++;
    } else {
      console.log('   ❌ FAIL - Should have returned 401, got:', response.statusCode);
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ FAIL -', error.message);
    results.failed++;
  }
  console.log('');

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(60));
  console.log('');
  console.log('✅ Passed:', results.passed);
  console.log('❌ Failed:', results.failed);
  console.log('📈 Success Rate:', Math.round((results.passed / (results.passed + results.failed)) * 100) + '%');
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Mobile app is ready to connect to backend!');
    console.log('');
    console.log('✅ Mobile App Configuration Status:');
    console.log('   • API Base URL: ' + API_BASE);
    console.log('   • Authentication: Working');
    console.log('   • Protected Routes: Working');
    console.log('   • Error Handling: Working');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start mobile app: npx expo start');
    console.log('   2. Test login flow in the app');
    console.log('   3. Verify user profile displays correctly');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log('');
}

// Run all tests
runTests().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});
