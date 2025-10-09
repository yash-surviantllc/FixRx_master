/**
 * Simple Magic Link Test Server
 * Tests magic link functionality without full FixRx server dependencies
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const magicLinkController = require('./src/controllers/magicLinkController');
const magicLinkRoutes = require('./src/routes/magicLinkRoutes');

const app = express();
const PORT = 3001; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const magicLinkRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  }
});

// Magic link routes
app.use('/api/v1/auth/magic-link', magicLinkRateLimit, magicLinkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Magic Link Test Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🧪 Magic Link Test Server Started
================================
📡 Port: ${PORT}
🔗 Magic Link Endpoints:
   POST http://localhost:${PORT}/api/v1/auth/magic-link/send
   POST http://localhost:${PORT}/api/v1/auth/magic-link/verify
   GET  http://localhost:${PORT}/api/v1/auth/magic-link/health
🏥 Health Check: http://localhost:${PORT}/health
================================
Ready for testing! 🚀
  `);
});

module.exports = app;
