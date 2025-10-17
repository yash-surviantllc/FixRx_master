require('dotenv').config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'fixrx_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    url: process.env.REDIS_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_replace_in_production_12345',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@yourdomain.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'FixRx',
    templates: {
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
      invitation: process.env.SENDGRID_TEMPLATE_INVITATION,
      passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET,
      magicLink: process.env.SENDGRID_TEMPLATE_MAGIC_LINK,
    },
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
};

module.exports = { config };
