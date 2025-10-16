# FixRx Platform - Complete Setup Documentation

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Backend Setup](#backend-setup)
3. [Database Setup](#database-setup)
4. [Frontend Setup](#frontend-setup)
5. [API Documentation](#api-documentation)
6. [Environment Configuration](#environment-configuration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **PostgreSQL**: Version 14.0 or higher
- **Redis**: Version 6.0 or higher (optional but recommended)
- **Git**: Latest version
- **npm**: Version 8.0.0 or higher (comes with Node.js)

### Recommended System Specifications

- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: Dual-core processor or better
- **Storage**: At least 2GB free space
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 20.04+

---

## Backend Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yash-surviantllc/FixRx_master.git
cd FixRx_master/Backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the Backend directory with the following configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixrx_db
DB_USER=fixrx_user
DB_PASSWORD=your_secure_password_here

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_long_replace_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters_long_replace_this
JWT_REFRESH_EXPIRES_IN=30d

# Twilio Configuration (SMS Services)
TWILIO_ACCOUNT_SID=ACyour_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Configuration (Email Services)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=FixRx

# OTP Configuration
OTP_DEV_MODE=true
OTP_DEV_CODE=123456
OTP_CODE_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
OTP_BLOCK_DURATION_MINUTES=15

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DISABLE_RATE_LIMIT=false

# Frontend Configuration
FRONTEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3000/api/v1
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080

# Google OAuth (Production Only)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 4: Start Backend Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:3000`

---

## Database Setup

### Step 1: PostgreSQL Installation

#### Windows
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run installer and follow the setup wizard
3. Remember the superuser password you set during installation

#### macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE fixrx_db;

# Create user with password
CREATE USER fixrx_user WITH PASSWORD 'your_secure_password_here';

# Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE fixrx_db TO fixrx_user;

# Grant schema permissions
\c fixrx_db
GRANT ALL ON SCHEMA public TO fixrx_user;

# Exit PostgreSQL
\q
```

### Step 3: Run Database Migrations

```bash
# Navigate to Backend directory
cd Backend

# Run migrations to create all tables
npm run migrate
```

This will create all required tables:
- `users` - User accounts
- `otp_verifications` - OTP authentication records
- `phone_auth_sessions` - Phone-based authentication sessions
- `conversations` - Chat conversations
- `messages` - Chat messages
- `invitations` - User invitations
- `contacts` - User contacts
- `sms_messages` - SMS tracking
- And other supporting tables

### Step 4: Seed Initial Data (Optional)

```bash
npm run seed
```

### Step 5: Verify Database Setup

```bash
# Connect to database
psql -U fixrx_user -d fixrx_db

# List all tables
\dt

# Check users table structure
\d users

# Exit
\q
```

---

## Frontend Setup

### Mobile Application (React Native)

#### Step 1: Navigate to Mobile Directory

```bash
cd FixRxMobile
```

#### Step 2: Install Dependencies

```bash
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..
```

#### Step 3: Environment Configuration

Create a `.env` file in the FixRxMobile directory:

```env
API_BASE_URL=http://localhost:3000/api/v1
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
ENVIRONMENT=development
```

#### Step 4: Start Development Server

```bash
# Start Metro bundler
npx react-native start

# In a new terminal, run for Android
npx react-native run-android

# Or for iOS (macOS only)
npx react-native run-ios
```

### Web Application (React)

#### Step 1: Navigate to Frontend Directory

```bash
cd Frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Environment Configuration

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Step 4: Start Development Server

```bash
npm run dev
```

The web application will be available at `http://localhost:3001`

---

## API Documentation

### Authentication Endpoints

#### OTP Authentication

**Send OTP**
```http
POST /api/v1/auth/otp/send
Content-Type: application/json

{
  "phone": "+1234567890",
  "purpose": "LOGIN"
}
```

**Verify OTP**
```http
POST /api/v1/auth/otp/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "sessionToken": "session_token"
  }
}
```

#### Magic Link Authentication

**Send Magic Link**
```http
POST /api/v1/auth/magic-link/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Verify Magic Link**
```http
POST /api/v1/auth/magic-link/verify
Content-Type: application/json

{
  "token": "magic_link_token"
}
```

### Contact Management Endpoints

**Import Contacts**
```http
POST /api/v1/contacts/import
Authorization: Bearer {token}
Content-Type: application/json

{
  "contacts": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    }
  ]
}
```

**Get Contacts**
```http
GET /api/v1/contacts
Authorization: Bearer {token}
```

**Sync Contacts**
```http
POST /api/v1/contacts/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device_uuid",
  "contacts": []
}
```

### Invitation Endpoints

**Send Single Invitation**
```http
POST /api/v1/invitations
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientName": "John Doe",
  "recipientPhone": "+1234567890",
  "recipientEmail": "john@example.com",
  "invitationType": "FRIEND",
  "customMessage": "Join FixRx!"
}
```

**Send Contractor Invitation**
```http
POST /api/v1/invitations/contractor-sms
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientName": "John Contractor",
  "recipientPhone": "+1234567890",
  "invitationType": "CONTRACTOR",
  "serviceCategory": "Plumbing"
}
```

**Get Sent Invitations**
```http
GET /api/v1/invitations/sent
Authorization: Bearer {token}
```

### Messaging Endpoints

**Get Conversations**
```http
GET /api/v1/messages
Authorization: Bearer {token}
```

**Create Conversation**
```http
POST /api/v1/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Conversation",
  "conversationType": "consumer_vendor"
}
```

**Send Message**
```http
POST /api/v1/messages/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello",
  "messageType": "text"
}
```

**Get Messages**
```http
GET /api/v1/messages/{conversationId}/messages
Authorization: Bearer {token}
```

### User Profile Endpoints

**Get Profile**
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

**Update Profile**
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

---

## Environment Configuration

### Development Environment

Development settings are optimized for local development with debugging enabled:

- **OTP_DEV_MODE=true**: Always uses "123456" as OTP code
- **DISABLE_RATE_LIMIT=true**: Disables rate limiting for easier testing
- **NODE_ENV=development**: Enables detailed error messages

### Production Environment

Production settings prioritize security and performance:

```env
NODE_ENV=production
OTP_DEV_MODE=false
DISABLE_RATE_LIMIT=false
JWT_SECRET=use_cryptographically_secure_64_character_string
JWT_REFRESH_SECRET=use_different_cryptographically_secure_64_character_string
```

### Third-Party Service Configuration

#### SendGrid (Email Service)

1. Create account at https://sendgrid.com
2. Generate API key in Settings > API Keys
3. Verify sender identity in Settings > Sender Authentication
4. Add API key to environment variables

#### Twilio (SMS Service)

1. Create account at https://twilio.com
2. Get Account SID and Auth Token from console dashboard
3. Purchase phone number for SMS sending
4. Add credentials to environment variables

#### Redis (Caching - Optional)

1. Install Redis locally or use cloud service
2. Configure connection in environment variables
3. Used for session management and caching

---

## Testing

### Backend Testing

#### Unit Tests
```bash
cd Backend
npm test
```

#### Integration Tests
```bash
npm run test:integration
```

#### Test Specific Features
```bash
# Test OTP authentication
npm run test:otp

# Test invitation system
npm run test:invitations

# Test messaging
npm run test:messaging
```

### Frontend Testing

#### Mobile App Testing
```bash
cd FixRxMobile
npm test
```

#### Web App Testing
```bash
cd Frontend
npm test
```

### API Testing with cURL

#### Test OTP Send
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "purpose": "LOGIN"}'
```

#### Test OTP Verify
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

---

## Deployment

### Docker Deployment

#### Create Docker Compose File

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: fixrx_db
      POSTGRES_USER: fixrx_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./Backend
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./Frontend
    ports:
      - "3001:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
docker-compose up -d
```

### Manual Production Deployment

#### Backend Deployment

1. Set up production server (Ubuntu recommended)
2. Install Node.js, PostgreSQL, Redis
3. Clone repository
4. Install dependencies: `npm ci --production`
5. Set production environment variables
6. Run migrations: `npm run migrate`
7. Start with PM2: `pm2 start src/server.js --name fixrx-backend`

#### Frontend Deployment

1. Build production bundle: `npm run build`
2. Serve static files with Nginx or Apache
3. Configure reverse proxy for API calls
4. Enable SSL/TLS certificates

---

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Failed

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Verify connection
psql -U fixrx_user -d fixrx_db -c "SELECT 1"
```

#### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 [PID]

# Or use different port in .env
PORT=3001
```

#### Migration Failed

**Error**: `permission denied for schema public`

**Solution**:
```sql
-- Connect as superuser
psql -U postgres -d fixrx_db

-- Grant permissions
GRANT ALL ON SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user;
```

#### Redis Connection Failed

**Error**: `Redis connection to localhost:6379 failed`

**Solution**:
```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server

# Or disable Redis in development
# Comment out Redis initialization in code
```

#### OTP Not Working

**Error**: `Failed to send verification code`

**Solution**:
1. Check Twilio credentials in .env
2. Verify phone number format includes country code
3. In development, ensure OTP_DEV_MODE=true
4. Check database has otp_verifications table

#### CORS Issues

**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution**:
1. Add frontend URL to CORS_ORIGINS in .env
2. Restart backend server
3. Verify frontend is using correct API_BASE_URL

### Database Debugging

#### Check Table Structure
```sql
-- Connect to database
psql -U fixrx_user -d fixrx_db

-- List all tables
\dt

-- Describe table structure
\d users
\d otp_verifications
\d conversations

-- Check recent OTP attempts
SELECT * FROM otp_verifications ORDER BY created_at DESC LIMIT 10;

-- Check user records
SELECT id, email, phone, created_at FROM users LIMIT 10;
```

#### Reset Database
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS fixrx_db"
psql -U postgres -c "CREATE DATABASE fixrx_db"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fixrx_db TO fixrx_user"

# Run migrations
cd Backend
npm run migrate
```

### Logging and Monitoring

#### Enable Debug Logging
```env
LOG_LEVEL=debug
DEBUG=*
```

#### Check Logs
```bash
# Backend logs
tail -f Backend/logs/error.log
tail -f Backend/logs/combined.log

# PM2 logs (if using PM2)
pm2 logs fixrx-backend

# Docker logs
docker-compose logs -f backend
```

---

## Support and Resources

### Documentation
- API Documentation: Located in `/Backend/docs/api.md`
- Database Schema: Located in `/Backend/database/schema.sql`
- Postman Collection: `/Backend/FixRx-API-Collection.postman_collection.json`

### Getting Help
- Check existing issues on GitHub
- Review troubleshooting section above
- Verify all environment variables are set correctly
- Ensure all required services are running

### Performance Optimization
- Enable Redis for caching
- Use database connection pooling
- Implement rate limiting in production
- Use CDN for static assets
- Enable gzip compression

---

## License

This project is proprietary software. All rights reserved.

---

## Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added OTP authentication
- **v1.2.0** - Added messaging system
- **v1.3.0** - Added invitation system
- **v1.4.0** - Database schema improvements

Last Updated: October 2024
