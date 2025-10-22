require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkConstraints() {
  try {
    // Check for triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'users'
    `);
    
    console.log('\nTRIGGERS ON USERS TABLE:');
    console.log('========================');
    if (triggers.rows.length === 0) {
      console.log('No triggers found');
    } else {
      triggers.rows.forEach(t => {
        console.log(`Trigger: ${t.trigger_name}`);
        console.log(`Event: ${t.event_manipulation}`);
        console.log(`Action: ${t.action_statement}`);
        console.log('---');
      });
    }
    
    // Check for check constraints
    const constraints = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_schema = 'public'
    `);
    
    console.log('\nCHECK CONSTRAINTS:');
    console.log('==================');
    if (constraints.rows.length === 0) {
      console.log('No check constraints found');
    } else {
      constraints.rows.forEach(c => {
        console.log(`Constraint: ${c.constraint_name}`);
        console.log(`Check: ${c.check_clause}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();
