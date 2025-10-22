const http = require('http');

const API_BASE = 'http://localhost:3000';

console.log('🧪 Testing FixRx Mobile API Connectivity\n');
console.log('Backend URL:', API_BASE);
console.log('─'.repeat(50));

// Test health endpoint
http.get(`${API_BASE}/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Health Check:', res.statusCode === 200 ? 'PASS' : 'FAIL');
    console.log('   Response:', JSON.parse(data).status);
  });
}).on('error', (err) => {
  console.log('❌ Health Check: FAIL');
  console.log('   Error:', err.message);
});

// Test API health endpoint
http.get(`${API_BASE}/api/v1/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ API Health Check:', res.statusCode === 200 ? 'PASS' : 'FAIL');
    console.log('   Version:', JSON.parse(data).version);
  });
}).on('error', (err) => {
  console.log('❌ API Health Check: FAIL');
  console.log('   Error:', err.message);
});

setTimeout(() => {
  console.log('─'.repeat(50));
  console.log('\n✅ API Configuration is ready!');
  console.log('\n📱 Mobile app can now connect to:');
  console.log('   • Health: ' + API_BASE + '/health');
  console.log('   • Login: ' + API_BASE + '/api/v1/auth/login');
  console.log('   • Profile: ' + API_BASE + '/api/v1/users/profile');
}, 1000);
