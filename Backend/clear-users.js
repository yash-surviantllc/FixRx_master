require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fixrx_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function clearUsers() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('CLEARING ALL USER DATA');
    console.log('='.repeat(80) + '\n');
    
    // Get count before deletion
    const countBefore = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Users before deletion: ${countBefore.rows[0].count}`);
    
    // Delete all users
    await pool.query('DELETE FROM users');
    console.log('✅ All users deleted');
    
    // Delete all magic links
    await pool.query('DELETE FROM magic_links');
    console.log('✅ All magic links deleted');
    
    // Verify deletion
    const countAfter = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Users after deletion: ${countAfter.rows[0].count}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE CLEARED - READY FOR FRESH START');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

clearUsers();
