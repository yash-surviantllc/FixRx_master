/**
 * Authentication Tests
 * Tests for magic link and OTP authentication
 */

const request = require('supertest');

describe('Authentication API', () => {
  let app;

  beforeAll(async () => {
    const { fixRxApp } = require('../src/app');
    await fixRxApp.initialize();
    app = fixRxApp.app;
  });

  describe('POST /api/v1/auth/magic-link/send', () => {
    it('should send magic link for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/magic-link/send')
        .send({
          email: 'test@example.com',
          purpose: 'REGISTRATION'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/magic-link/send')
        .send({
          email: 'invalid-email',
          purpose: 'REGISTRATION'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/magic-link/send')
        .send({
          purpose: 'REGISTRATION'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/otp/send', () => {
    it('should send OTP for valid phone number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({
          phone: '+1234567890',
          purpose: 'REGISTRATION'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({
          phone: 'invalid',
          purpose: 'REGISTRATION'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/magic-link/health', () => {
    it('should return magic link service health', async () => {
      const response = await request(app)
        .get('/api/v1/auth/magic-link/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/auth/otp/health', () => {
    it('should return OTP service health', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });
});
