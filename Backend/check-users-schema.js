require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

pool.query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'users'
  AND column_name IN ('first_name', 'last_name', 'phone', 'metro_area')
  ORDER BY ordinal_position
`)
.then(r => {
  console.log('\nUSERS TABLE - NAME COLUMNS:');
  console.log('============================');
  r.rows.forEach(col => {
    console.log(`${col.column_name.padEnd(20)} Type: ${col.data_type.padEnd(20)} Nullable: ${col.is_nullable.padEnd(5)} Default: ${col.column_default || 'NULL'}`);
  });
  console.log('\n');
  pool.end();
})
.catch(e => {
  console.error('Error:', e.message);
  pool.end();
});
