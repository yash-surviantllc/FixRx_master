require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { dbManager } = require('../../src/config/database');

async function main() {
  try {
    await dbManager.initialize();

    const { rows } = await dbManager.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'users'
       ORDER BY ordinal_position`
    );

    console.log('User table columns:');
    rows.forEach(row => console.log('-', row.column_name));
  } catch (err) {
    console.error('Error listing columns:', err);
  } finally {
    process.exit(0);
  }
}

main();
