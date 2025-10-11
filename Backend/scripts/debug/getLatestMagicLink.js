require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { dbManager } = require('../../src/config/database');

async function main() {
  try {
    await dbManager.initialize();

    const email = process.argv[2];
    if (!email) {
      console.error('Usage: node getLatestMagicLink.js <email>');
      process.exit(1);
    }

    const { rows } = await dbManager.query(
      `SELECT id, email, token, purpose, is_used, expires_at, created_at
       FROM magic_links
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [email]
    );

    if (!rows.length) {
      console.log('No magic links found for', email);
      process.exit(0);
    }

    console.log(`Latest magic links for ${email}`);
    rows.forEach((row, idx) => {
      console.log(`\n#${idx + 1}`);
      console.log(`  id        : ${row.id}`);
      console.log(`  token     : ${row.token}`);
      console.log(`  tokenLen  : ${row.token?.length}`);
      console.log(`  purpose   : ${row.purpose}`);
      console.log(`  is_used   : ${row.is_used}`);
      console.log(`  expiresAt : ${row.expires_at?.toISOString?.() || row.expires_at}`);
      console.log(`  createdAt : ${row.created_at?.toISOString?.() || row.created_at}`);
    });
  } catch (err) {
    console.error('Error fetching magic links:', err);
  } finally {
    process.exit(0);
  }
}

main();
