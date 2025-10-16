# FixRx Platform

## Overview

FixRx is a comprehensive client-vendor management platform that connects consumers with trusted contractors and service providers. The platform provides a complete ecosystem for service discovery, communication, and relationship management.

## System Architecture

- **Backend API**: Node.js/Express REST API with PostgreSQL database
- **Web Application**: React-based web interface 
- **Mobile Application**: React Native for iOS and Android
- **Real-time Features**: WebSocket support for messaging and notifications
- **Authentication**: OTP-based phone authentication and magic link email authentication

## Quick Start

```bash
# Clone repository
git clone https://github.com/yash-surviantllc/FixRx_master.git
cd FixRx_master

# Setup Backend
cd Backend
npm install
cp .env.example .env    # Configure your environment variables
npm run migrate         # Setup database tables
npm run dev            # Start backend server on port 3000

# Setup Frontend (new terminal)
cd ../Frontend
npm install
npm run dev            # Start web application on port 3001

# Setup Mobile App (new terminal)
cd ../FixRxMobile
npm install
npx react-native run-android  # or run-ios for iOS
```

## Features

### Core Functionality

- **OTP Authentication**: Phone-based authentication with SMS verification
- **Magic Link Authentication**: Passwordless email authentication via SendGrid
- **Contact Management**: Import and sync contacts from mobile devices
- **Invitation System**: Send invitations to contacts via SMS (Twilio) or Email
- **Messaging System**: Real-time chat between consumers and vendors
- **User Profiles**: Comprehensive profile management for consumers and vendors
- **Search & Discovery**: Find vendors by location, service type, and ratings

### Technical Features

- **RESTful API**: Well-documented endpoints for all platform features
- **Database Migrations**: Automated schema management with version control
- **Session Management**: JWT-based authentication with refresh tokens
- **Rate Limiting**: Protection against API abuse
- **CORS Support**: Configured for web and mobile applications
- **Error Handling**: Comprehensive error logging and user-friendly responses

## Technology Stack

### Backend
- **Node.js 18+** with Express.js framework
- **PostgreSQL 14+** for primary database
- **Redis** for caching and session management (optional)
- **JWT** for authentication tokens
- **bcrypt** for password hashing
- **Joi** for input validation

### Frontend Web
- **React 18+** with TypeScript
- **Vite** for build tooling
- **Axios** for API communication
- **Tailwind CSS** for styling

### Mobile Application
- **React Native** for cross-platform mobile development
- **React Navigation** for navigation
- **AsyncStorage** for local data persistence

### Third-Party Services
- **SendGrid** for email delivery (magic links, notifications)
- **Twilio** for SMS services (OTP codes, invitations)
- **Google OAuth** for social authentication (production only)

## Project Structure

```
FixRx_master/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   └── utils/           # Utilities
│   ├── database/
│   │   └── migrations/      # SQL migration files
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── FixRxMobile/
    ├── src/
    │   ├── screens/
    │   ├── components/
    │   └── services/
    ├── ios/
    └── android/
```

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 14.0 or higher
- Redis 6.0 or higher (optional but recommended)
- npm 8.0.0 or higher
- Git

## Installation

### 1. Database Setup

#### Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql@14`
- **Linux**: `sudo apt install postgresql postgresql-contrib`

#### Create Database
```sql
psql -U postgres
CREATE DATABASE fixrx_db;
CREATE USER fixrx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fixrx_db TO fixrx_user;
\c fixrx_db
GRANT ALL ON SCHEMA public TO fixrx_user;
\q
```

### 2. Backend Setup

```bash
cd Backend
npm install

# Create .env file with your configuration
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env.local

# Start development server
npm run dev
```

### 4. Mobile App Setup

```bash
cd FixRxMobile
npm install

# iOS only (macOS)
cd ios && pod install && cd ..

# Create .env file
echo "API_BASE_URL=http://localhost:3000/api/v1" > .env

# Run the app
npx react-native start
npx react-native run-android  # or run-ios
```

## Environment Configuration

### Backend (.env)

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
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters_long
JWT_REFRESH_EXPIRES_IN=30d

# OTP Configuration (Development)
OTP_DEV_MODE=true
OTP_DEV_CODE=123456
OTP_CODE_LENGTH=6
OTP_EXPIRY_MINUTES=10

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=FixRx

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URLs
FRONTEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3000/api/v1
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DISABLE_RATE_LIMIT=false
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

### Authentication Endpoints

#### OTP Authentication
```http
POST /auth/otp/send
Body: { "phone": "+1234567890", "purpose": "LOGIN" }

POST /auth/otp/verify
Body: { "phone": "+1234567890", "code": "123456" }
```

#### Magic Link Authentication
```http
POST /auth/magic-link/send
Body: { "email": "user@example.com" }

POST /auth/magic-link/verify
Body: { "token": "magic_link_token" }
```

### Contact Management
```http
POST /contacts/import
Headers: Authorization: Bearer {token}
Body: { "contacts": [{ "name": "John", "phone": "+1234567890" }] }

GET /contacts
Headers: Authorization: Bearer {token}
```

### Invitations
```http
POST /invitations
Headers: Authorization: Bearer {token}
Body: {
  "recipientName": "John Doe",
  "recipientPhone": "+1234567890",
  "invitationType": "FRIEND"
}

GET /invitations/sent
Headers: Authorization: Bearer {token}
```

### Messaging
```http
GET /messages
Headers: Authorization: Bearer {token}

POST /messages/{conversationId}/messages
Headers: Authorization: Bearer {token}
Body: { "content": "Hello", "messageType": "text" }
```

## Testing

### Backend Tests
```bash
cd Backend
npm test                # Run all tests
npm run test:coverage   # With coverage report
```

### API Testing
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

## Database Management

### Run Migrations
```bash
cd Backend
npm run migrate
```

### Seed Data
```bash
npm run seed
```

### Reset Database
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS fixrx_db"
psql -U postgres -c "CREATE DATABASE fixrx_db"

# Re-run migrations
npm run migrate
```

## Deployment

### Using Docker
```yaml
# docker-compose.yml
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

  backend:
    build: ./Backend
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run: `docker-compose up -d`

### Manual Deployment

1. **Setup Server** (Ubuntu 20.04+ recommended)
2. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql
   ```
3. **Clone and Setup**
   ```bash
   git clone https://github.com/yash-surviantllc/FixRx_master.git
   cd FixRx_master/Backend
   npm ci --production
   ```
4. **Configure Environment** (production values)
5. **Run with PM2**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name fixrx-backend
   pm2 save
   pm2 startup
   ```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 [PID]
```

### Migration Failed
```sql
-- As superuser
psql -U postgres -d fixrx_db
GRANT ALL ON SCHEMA public TO fixrx_user;
```

### OTP Not Working
1. Check Twilio credentials in .env
2. Verify phone format includes country code (+1234567890)
3. In development, ensure `OTP_DEV_MODE=true`

### CORS Issues
1. Add frontend URL to `CORS_ORIGINS` in .env
2. Restart backend server

## Important Notes

### Contact Permissions
The contacts permission popup (iOS/Android) is handled entirely by the frontend/mobile app. The backend only receives and processes contact data after user grants permission on their device.

### Development vs Production
- **Development**: OTP code is always "123456" when `OTP_DEV_MODE=true`
- **Production**: Real SMS codes via Twilio, real magic links via SendGrid

### Security
- Never commit `.env` files
- Use strong JWT secrets (minimum 32 characters)
- Enable rate limiting in production
- Use HTTPS in production

## Documentation

- **Full Setup Guide**: See `SETUP_DOCUMENTATION.md`
- **Project Documentation**: See `PROJECT_DOCUMENTATION.md`
- **API Collection**: Import `Backend/FixRx-API-Collection.postman_collection.json` into Postman

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review documentation files
3. Check GitHub issues
4. Contact the development team

## License

This project is proprietary software. All rights reserved.

## Version

Current Version: 1.4.0
Last Updated: October 2024
