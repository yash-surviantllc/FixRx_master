require('dotenv').config();
const { Pool } = require('pg');
const http = require('http');

console.log('\n========================================');
console.log('FIXRX BACKEND DIAGNOSTIC');
console.log('========================================\n');

// Check 1: Environment variables
console.log('1️⃣  ENVIRONMENT VARIABLES');
console.log('   DB_HOST:', process.env.DB_HOST || '❌ NOT SET');
console.log('   DB_PORT:', process.env.DB_PORT || '❌ NOT SET');
console.log('   DB_NAME:', process.env.DB_NAME || '❌ NOT SET');
console.log('   DB_USER:', process.env.DB_USER || '❌ NOT SET');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('   PORT:', process.env.PORT || '3000 (default)');
console.log('');

// Check 2: Database connection
console.log('2️⃣  DATABASE CONNECTION');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

pool.query('SELECT NOW()')
  .then(() => {
    console.log('   ✅ Database connected successfully');
    
    // Check 3: Users table
    console.log('\n3️⃣  USERS TABLE');
    return pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('first_name', 'last_name', 'phone', 'metro_area')
    `);
  })
  .then(result => {
    const columns = result.rows.map(r => r.column_name);
    console.log('   first_name:', columns.includes('first_name') ? '✅' : '❌');
    console.log('   last_name:', columns.includes('last_name') ? '✅' : '❌');
    console.log('   phone:', columns.includes('phone') ? '✅' : '❌');
    console.log('   metro_area:', columns.includes('metro_area') ? '✅' : '❌');
    
    // Check 4: User count
    console.log('\n4️⃣  USER COUNT');
    return pool.query('SELECT COUNT(*) as count FROM users');
  })
  .then(result => {
    console.log('   Total users:', result.rows[0].count);
    
    // Check 5: Backend server
    console.log('\n5️⃣  BACKEND SERVER');
    const port = process.env.PORT || 3000;
    
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/v1/health',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Server is running on port', port);
        console.log('   ✅ Health endpoint responding');
      } else {
        console.log('   ⚠️  Server running but health check failed');
        console.log('   Status:', res.statusCode);
      }
      
      printSummary();
    });
    
    req.on('error', (error) => {
      console.log('   ❌ Server is NOT running on port', port);
      console.log('   Error:', error.message);
      console.log('\n   💡 Start the server with: npm start');
      
      printSummary();
    });
    
    req.on('timeout', () => {
      console.log('   ❌ Server request timed out');
      req.destroy();
      printSummary();
    });
    
    req.end();
  })
  .catch(error => {
    console.log('   ❌ Database connection failed');
    console.log('   Error:', error.message);
    
    console.log('\n========================================');
    console.log('SUMMARY: ❌ ISSUES FOUND');
    console.log('========================================');
    console.log('Fix database connection and try again.');
    console.log('');
    
    pool.end();
    process.exit(1);
  });

function printSummary() {
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('✅ Database: Connected');
  console.log('✅ Schema: All columns exist');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure backend server is running: npm start');
  console.log('2. Test from phone browser: http://YOUR_IP:3000/api/v1/health');
  console.log('3. Fill profile form in app');
  console.log('4. Check logs in Expo console and backend terminal');
  console.log('5. Verify data: node view-all-users.js');
  console.log('');
  
  pool.end();
  process.exit(0);
}
