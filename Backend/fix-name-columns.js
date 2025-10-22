require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function fixNameColumns() {
  try {
    console.log('\n========================================');
    console.log('FIXING NAME COLUMNS TO BE NULLABLE');
    console.log('========================================\n');
    
    // Make first_name and last_name nullable
    console.log('Making first_name nullable...');
    await pool.query(`ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL`);
    console.log('✅ first_name is now nullable');
    
    console.log('Making last_name nullable...');
    await pool.query(`ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL`);
    console.log('✅ last_name is now nullable');
    
    // Set default values for empty strings to NULL
    console.log('\nUpdating empty strings to NULL...');
    const result = await pool.query(`
      UPDATE users 
      SET first_name = NULL 
      WHERE first_name = ''
    `);
    console.log(`✅ Updated ${result.rowCount} rows with empty first_name`);
    
    const result2 = await pool.query(`
      UPDATE users 
      SET last_name = NULL 
      WHERE last_name = ''
    `);
    console.log(`✅ Updated ${result2.rowCount} rows with empty last_name`);
    
    console.log('\n========================================');
    console.log('✅ MIGRATION COMPLETE');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixNameColumns();
