/**
 * Health Check Tests
 * Basic tests to ensure API is working
 */

const request = require('supertest');

describe('Health Check API', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Import app
    const { fixRxApp } = require('../src/app');
    await fixRxApp.initialize();
    app = fixRxApp.app;
  });

  afterAll(async () => {
    // Cleanup
    if (server) {
      await server.close();
    }
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should return uptime information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });
  });
});
