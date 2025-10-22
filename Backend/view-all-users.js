require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function viewAllUsers() {
  try {
    console.log('\n========================================');
    console.log('FIXRX USER DATABASE');
    console.log('========================================\n');
    
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);
    
    console.log('Total Users:', totalUsers);
    
    if (totalUsers === 0) {
      console.log('\nNo users found - Database is empty\n');
      return;
    }
    
    const result = await pool.query(`
      SELECT 
        id, email, first_name, last_name, user_type, phone, metro_area,
        is_verified, profile_completed, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    result.rows.forEach((user, index) => {
      console.log('\n----------------------------------------');
      console.log(`USER #${index + 1}`);
      console.log('----------------------------------------');
      console.log('ID:                ', user.id);
      console.log('Email:             ', user.email);
      console.log('First Name:        ', user.first_name || '(Not provided)');
      console.log('Last Name:         ', user.last_name || '(Not provided)');
      console.log('Phone:             ', user.phone || '(Not provided)');
      console.log('Metro Area:        ', user.metro_area || '(Not provided)');
      console.log('User Type:         ', user.user_type ? user.user_type.toUpperCase() : '(Not set)');
      console.log('Email Verified:    ', user.is_verified ? 'YES' : 'NO');
      console.log('Profile Completed: ', user.profile_completed ? 'YES' : 'NO');
      console.log('Created:           ', new Date(user.created_at).toLocaleString());
      console.log('Updated:           ', new Date(user.updated_at).toLocaleString());
    });
    
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified,
        COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed,
        COUNT(CASE WHEN user_type = 'consumer' THEN 1 END) as consumers,
        COUNT(CASE WHEN user_type = 'vendor' THEN 1 END) as vendors
      FROM users
    `);
    
    const s = stats.rows[0];
    console.log('Total Users:       ', s.total);
    console.log('Email Verified:    ', s.verified);
    console.log('Profile Completed: ', s.completed);
    console.log('Consumers:         ', s.consumers);
    console.log('Vendors:           ', s.vendors);
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

viewAllUsers();
