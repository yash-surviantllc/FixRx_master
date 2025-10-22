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
  SELECT 
    id, email, 
    first_name, LENGTH(first_name) as fn_len,
    last_name, LENGTH(last_name) as ln_len,
    phone, LENGTH(phone) as phone_len,
    metro_area, LENGTH(metro_area) as ma_len,
    user_type, is_verified, profile_completed
  FROM users 
  WHERE email = 'jaiswalyashraj18@gmail.com'
`)
.then(r => {
  if (r.rows.length === 0) {
    console.log('User not found');
  } else {
    const user = r.rows[0];
    console.log('\nUSER DATA (RAW):');
    console.log('================');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('First Name:', JSON.stringify(user.first_name), `(length: ${user.fn_len})`);
    console.log('Last Name:', JSON.stringify(user.last_name), `(length: ${user.ln_len})`);
    console.log('Phone:', JSON.stringify(user.phone), `(length: ${user.phone_len})`);
    console.log('Metro Area:', JSON.stringify(user.metro_area), `(length: ${user.ma_len})`);
    console.log('User Type:', user.user_type);
    console.log('Verified:', user.is_verified);
    console.log('Profile Complete:', user.profile_completed);
  }
  pool.end();
})
.catch(e => {
  console.error('Error:', e.message);
  pool.end();
});
