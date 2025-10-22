# FixRx Platform - Complete Project Documentation

## Overview

FixRx is a comprehensive client-vendor management platform connecting consumers with trusted contractors and service providers. The platform consists of a Node.js backend API, PostgreSQL database, React web application, and React Native mobile application.

## Project Structure

```
FixRx_master/
├── Backend/                  # Node.js Express API server
│   ├── src/                  # Source code
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Express middleware
│   │   ├── config/           # Configuration files
│   │   └── utils/            # Utility functions
│   ├── database/             # Database schemas and migrations
│   └── docs/                 # API documentation
├── Frontend/                 # React web application
│   ├── src/                  
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── utils/            # Utilities
│   └── public/               # Static assets
└── FixRxMobile/              # React Native mobile app
    ├── src/
    │   ├── screens/          # Screen components
    │   ├── components/       # Reusable components
    │   ├── services/         # API services
    │   └── navigation/       # Navigation setup
    ├── ios/                  # iOS specific code
    └── android/              # Android specific code
```

---

## Quick Start Guide

### Prerequisites

1. **Node.js** (v18.0.0 or higher)
2. **PostgreSQL** (v14.0 or higher)
3. **Redis** (v6.0 or higher) - Optional but recommended
4. **Git**
5. **npm** (v8.0.0 or higher)

### Basic Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/yash-surviantllc/FixRx_master.git
cd FixRx_master

# 2. Setup Backend
cd Backend
npm install
cp .env.example .env
# Edit .env with your configuration

# 3. Setup Database
npm run migrate

# 4. Start Backend Server
npm run dev

# 5. Setup Frontend (new terminal)
cd ../Frontend
npm install
npm run dev

# 6. Setup Mobile App (new terminal)
cd ../FixRxMobile
npm install
npx react-native run-android  # or run-ios for iOS
```

---

## Backend Setup

### Installation

```bash
cd Backend
npm install
```

### Environment Configuration

Create a `.env` file in the Backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixrx_db
DB_USER=fixrx_user
DB_PASSWORD=your_secure_password_here

# Redis Configuration (Optional for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=30d

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=FixRx

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACyour_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OTP Configuration
OTP_DEV_MODE=true
OTP_DEV_CODE=123456
OTP_CODE_LENGTH=6
OTP_EXPIRY_MINUTES=10

# Frontend URLs
FRONTEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3000/api/v1
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080

# Google OAuth (Production only)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DISABLE_RATE_LIMIT=false
```

### Running the Backend

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

---

## Database Setup

### PostgreSQL Installation

#### Windows
1. Download from https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Remember the superuser password

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Database Creation

```sql
-- Connect as superuser
psql -U postgres

-- Create database
CREATE DATABASE fixrx_db;

-- Create user
CREATE USER fixrx_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fixrx_db TO fixrx_user;

-- Connect to database
\c fixrx_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO fixrx_user;

-- Exit
\q
```

### Running Migrations

```bash
cd Backend
npm run migrate
```

This creates all required tables:
- `users` - User accounts and profiles
- `otp_verifications` - OTP authentication records
- `phone_auth_sessions` - Phone session management
- `conversations` - Chat conversations
- `messages` - Individual messages
- `conversation_participants` - Chat participants
- `invitations` - User invitations
- `contacts` - Contact management
- `sms_messages` - SMS tracking

### Seeding Data (Optional)

```bash
npm run seed
```

---

## Frontend Setup (Web Application)

### Installation

```bash
cd Frontend
npm install
```

### Environment Configuration

Create `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Running the Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Access at: http://localhost:3001

---

## Mobile Application Setup

### Prerequisites

- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- Android SDK or iOS Simulator

### Installation

```bash
cd FixRxMobile
npm install

# iOS only (macOS)
cd ios && pod install && cd ..
```

### Environment Configuration

Create `.env` file:

```env
API_BASE_URL=http://localhost:3000/api/v1
GOOGLE_MAPS_API_KEY=your_api_key
ENVIRONMENT=development
```

### Running the Mobile App

```bash
# Start Metro bundler
npx react-native start

# Android (new terminal)
npx react-native run-android

# iOS (new terminal, macOS only)
npx react-native run-ios
```

### Building for Production

#### Android
```bash
cd android
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/
```

#### iOS
```bash
cd ios
xcodebuild -workspace FixRxMobile.xcworkspace -scheme FixRxMobile -configuration Release
```

---

## API Documentation

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

### Authentication

#### OTP Authentication

**Send OTP Code**
```http
POST /auth/otp/send
Content-Type: application/json

{
  "phone": "+1234567890",
  "purpose": "LOGIN"
}

Response:
{
  "success": true,
  "message": "Verification code sent",
  "data": {
    "phone": "+1234567890",
    "expiresIn": 600,
    "otpVerificationId": "uuid"
  }
}
```

**Verify OTP Code**
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "user": {},
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "sessionToken": "session_token"
  }
}
```

#### Magic Link Authentication

**Send Magic Link**
```http
POST /auth/magic-link/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Verify Magic Link**
```http
POST /auth/magic-link/verify
Content-Type: application/json

{
  "token": "magic_link_token"
}
```

### Contact Management

**Import Contacts**
```http
POST /contacts/import
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

**Note on Contact Permissions**: The permission popup for accessing device contacts is handled entirely by the frontend (mobile app). The backend only receives and processes the contact data after the user grants permission on their device.

**Get User Contacts**
```http
GET /contacts
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Sync Contacts**
```http
POST /contacts/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device_uuid",
  "contacts": [],
  "lastSyncTime": "2024-01-01T00:00:00Z"
}
```

### Invitations

**Send Invitation**
```http
POST /invitations
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
POST /invitations/contractor-sms
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
GET /invitations/sent
Authorization: Bearer {token}
```

### Messaging

**Get Conversations**
```http
GET /messages
Authorization: Bearer {token}
```

**Create Conversation**
```http
POST /messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Conversation",
  "conversationType": "consumer_vendor"
}
```

**Send Message**
```http
POST /messages/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello",
  "messageType": "text"
}
```

### User Profile

**Get Profile**
```http
GET /users/profile
Authorization: Bearer {token}
```

**Update Profile**
```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

---

## Third-Party Services Setup

### SendGrid (Email Service)

1. Create account at https://sendgrid.com
2. Generate API key: Settings > API Keys > Create API Key
3. Verify sender: Settings > Sender Authentication
4. Add to `.env`:
```env
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=verified@email.com
```

### Twilio (SMS Service)

1. Create account at https://twilio.com
2. Get credentials from dashboard
3. Purchase phone number
4. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Google OAuth (Production Only)

1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Configure consent screen
5. Publish app (required for production)
6. Add to `.env`:
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

---

## Testing

### Backend Tests

```bash
cd Backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific modules
npm run test:auth
npm run test:otp
npm run test:invitations
```

### Frontend Tests

```bash
cd Frontend

# Run tests
npm test

# Run with watch mode
npm run test:watch
```

### Mobile App Tests

```bash
cd FixRxMobile

# Run tests
npm test

# E2E tests (Detox)
npm run test:e2e
```

### API Testing with cURL

```bash
# Test OTP send
curl -X POST http://localhost:3000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "purpose": "LOGIN"}'

# Test OTP verify (dev mode uses 123456)
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

---

## Deployment

### Production Environment Variables

```env
NODE_ENV=production
OTP_DEV_MODE=false
DISABLE_RATE_LIMIT=false
JWT_SECRET=use_strong_64_character_secret_here
JWT_REFRESH_SECRET=use_different_64_character_secret_here
```

### Docker Deployment

Create `docker-compose.yml`:

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
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

### Manual Deployment

#### Backend
1. Setup server (Ubuntu 20.04+ recommended)
2. Install Node.js, PostgreSQL, Redis
3. Clone repository
4. Install dependencies: `npm ci --production`
5. Set environment variables
6. Run migrations: `npm run migrate`
7. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js --name fixrx-backend
pm2 save
pm2 startup
```

#### Frontend
1. Build: `npm run build`
2. Serve with Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/fixrx/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Verify connection
psql -U fixrx_user -d fixrx_db -c "SELECT 1"
```

#### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 [PID]
```

#### Migration Failed
```sql
-- Grant permissions (as superuser)
psql -U postgres -d fixrx_db
GRANT ALL ON SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user;
```

#### OTP Not Working
1. Check Twilio credentials
2. Verify phone format (+country_code)
3. In development, ensure OTP_DEV_MODE=true
4. Check otp_verifications table exists

#### CORS Issues
1. Add frontend URL to CORS_ORIGINS
2. Restart backend server
3. Verify API_BASE_URL in frontend

### Database Debugging

```sql
-- Check tables
\dt

-- Check table structure
\d users
\d otp_verifications

-- View recent OTP attempts
SELECT * FROM otp_verifications 
ORDER BY created_at DESC LIMIT 10;

-- Check user records
SELECT id, email, phone, created_at 
FROM users LIMIT 10;
```

### Logs

```bash
# Backend logs
tail -f logs/error.log
tail -f logs/combined.log

# PM2 logs
pm2 logs fixrx-backend

# Docker logs
docker-compose logs -f backend
```

---

## Performance Optimization

### Database
- Create indexes on frequently queried columns
- Use connection pooling
- Implement query result caching with Redis
- Regular VACUUM and ANALYZE

### Backend
- Enable Redis caching
- Implement rate limiting
- Use compression middleware
- Optimize image uploads

### Frontend
- Enable code splitting
- Implement lazy loading
- Use CDN for static assets
- Optimize bundle size

---

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets
- Rotate keys regularly
- Use different keys for each environment

### Database
- Use parameterized queries
- Implement row-level security
- Regular backups
- Encrypt sensitive data

### API
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs
- Implement CORS properly

### Authentication
- Use secure JWT storage
- Implement refresh token rotation
- Set appropriate token expiry
- Use 2FA for admin accounts

---

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Contact development team

---

## License

Proprietary software. All rights reserved.

---

## Version

Current Version: 1.4.0
Last Updated: October 2024
