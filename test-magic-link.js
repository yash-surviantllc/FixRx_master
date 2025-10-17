/**
 * Test Magic Link Functionality
 * Run this to verify the backend is working
 */

const http = require('http');

const testEmail = 'test@example.com';
const apiUrl = 'http://192.168.1.5:3000/api/v1/auth/magic-link/send';

console.log('🧪 Testing Magic Link API...');
console.log('📧 Email:', testEmail);
console.log('🌐 URL:', apiUrl);
console.log('');

const postData = JSON.stringify({
  email: testEmail,
  purpose: 'REGISTRATION'
});

const options = {
  hostname: '192.168.1.5',
  port: 3000,
  path: '/api/v1/auth/magic-link/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 10000
};

const req = http.request(options, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📦 Response Body:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('');
        console.log('✅ SUCCESS! Magic link sent successfully!');
        console.log('📧 Check your email:', testEmail);
      } else {
        console.log('');
        console.log('❌ FAILED:', response.message);
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('');
  console.log('❌ REQUEST FAILED:');
  console.log('Error:', error.message);
  console.log('');
  console.log('🔍 Possible issues:');
  console.log('  1. Backend server is not running (run: npm run dev)');
  console.log('  2. Wrong IP address (check your local IP)');
  console.log('  3. Port 3000 is blocked by firewall');
  console.log('  4. Backend crashed during startup');
});

req.on('timeout', () => {
  console.log('');
  console.log('⏱️  REQUEST TIMED OUT');
  console.log('Backend is not responding. Make sure it\'s running!');
  req.destroy();
});

req.write(postData);
req.end();
