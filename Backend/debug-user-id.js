require('dotenv').config();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Paste the JWT token from the logs here
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlOGQwMmJkOS02NDQwLTQ5YjctYmMwMy03YTVlNDBhZjQzMTQiLCJlbWFpbCI6ImphaXN3YWx5YXNocmFqMThAZ21haWwuY29tIiwidXNlclR5cGUiOiJjb25zdW1lciIsImlhdCI6MTc2MDc3NDczNywiZXhwIjoxNzYwNzc1NjM3fQ.XcZi-3RjNDx6k5ROjnguLUHCh9Y-DCIMjFVs4wGrOfQ';

async function debug() {
  try {
    console.log('\n========================================');
    console.log('JWT TOKEN DEBUG');
    console.log('========================================\n');
    
    // Decode token
    const decoded = jwt.decode(token);
    console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));
    console.log('User ID from JWT:', decoded.userId);
    
    // Check if user exists in database
    console.log('\n========================================');
    console.log('CHECKING DATABASE');
    console.log('========================================\n');
    
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      console.log('❌ USER NOT FOUND IN DATABASE!');
      console.log('User ID:', decoded.userId);
      console.log('\nChecking all users in database:');
      
      const allUsers = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
      console.log('\nRecent users:');
      allUsers.rows.forEach((user, i) => {
        console.log(`${i + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
      
      console.log('🔍 ISSUE: The user ID in the JWT token does not exist in the database!');
      console.log('This means the user was created but with a different ID, or was deleted.');
    } else {
      console.log('✅ USER FOUND IN DATABASE!');
      const user = result.rows[0];
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('First Name:', user.first_name || '(null)');
      console.log('Last Name:', user.last_name || '(null)');
      console.log('Phone:', user.phone || '(null)');
      console.log('Metro Area:', user.metro_area || '(null)');
      console.log('User Type:', user.user_type);
      console.log('Profile Completed:', user.profile_completed);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debug();
