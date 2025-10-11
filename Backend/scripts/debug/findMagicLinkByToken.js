require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { dbManager } = require('../../src/config/database');

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Usage: node findMagicLinkByToken.js <token>');
    process.exit(1);
  }

  try {
    await dbManager.initialize();
    const { rows } = await dbManager.query(
      `SELECT id, email, token, length(token) AS token_len, is_used, expires_at, created_at
       FROM magic_links
       WHERE token = $1`,
      [token]
    );

    if (!rows.length) {
      console.log('No magic link found for token');
    } else {
      console.log('Magic link record:', rows[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
