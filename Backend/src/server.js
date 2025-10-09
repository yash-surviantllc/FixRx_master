/**
 * FixRx Server Entry Point
 * Production-ready server with graceful shutdown
 */

require('dotenv').config();
const { fixRxApp } = require('./app');

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await fixRxApp.stop();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  try {
    const port = process.env.PORT || 3000;
    await fixRxApp.start(port);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { fixRxApp };
