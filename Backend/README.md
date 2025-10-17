# FixRx Backend API

A comprehensive Node.js backend API for the FixRx service marketplace platform, connecting consumers with trusted service providers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run setup:db

# Start development server
npm run dev
```

## 📋 Features

### ✅ Authentication System
- **Magic Link Authentication** - Passwordless login via email
- **Google OAuth Integration** - Sign in with Google
- **JWT Token Management** - Secure session handling
- **Rate Limiting** - Protection against abuse

### ✅ User Management
- **Multi-role Support** - Consumers, Vendors, Admins
- **Profile Management** - Complete user profiles
- **Email Verification** - Secure email validation
- **Account Status Management** - Active/inactive accounts

### ✅ Service Management
- **Service Categories** - Organized service taxonomy
- **Vendor Services** - Service provider offerings
- **Geographic Search** - Location-based service discovery
- **Service Ratings** - User feedback system

### ✅ Communication System
- **Connection Requests** - Consumer-vendor connections
- **Real-time Messaging** - In-app communication
- **Invitation System** - User referrals
- **Notification System** - Push and email notifications

### ✅ Infrastructure
- **Database Management** - PostgreSQL with migrations
- **Email Service** - SendGrid integration
- **SMS Service** - Twilio integration
- **File Upload** - AWS S3 integration
- **Monitoring** - Health checks and logging

## 🏗️ Architecture

```
Backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── utils/           # Helper functions
│   └── server.js        # Application entry point
├── database/
│   ├── migrations/      # Database migrations
│   ├── seeds/           # Sample data
│   └── create-tables.js # Database setup
├── tests/               # Test suites
├── docs/                # API documentation
└── package.json
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixrx_db
DB_USER=fixrx_user
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@fixrx.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
```

## 🗄️ Database Setup

### Automatic Setup (Recommended)
```bash
npm run setup:db
```

### Manual Setup
```bash
# Create PostgreSQL database
createdb fixrx_db

# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed
```

### Database Schema
- **users** - User accounts and profiles
- **service_categories** - Service classification
- **services** - Available services
- **vendor_services** - Vendor service offerings
- **connection_requests** - Consumer-vendor connections
- **messages** - User communications
- **ratings** - Service ratings and reviews
- **notifications** - User notifications
- **magic_links** - Passwordless authentication tokens

## 🔐 Authentication

### Magic Link Authentication
Passwordless authentication via email:

```javascript
// Send magic link
POST /api/v1/auth/magic-link/send
{
  "email": "user@example.com",
  "purpose": "LOGIN" // or "REGISTRATION"
}

// Verify magic link
POST /api/v1/auth/magic-link/verify
{
  "token": "magic_link_token",
  "email": "user@example.com"
}
```

### Google OAuth
Social authentication integration:

```javascript
// Verify Google ID token
POST /api/v1/auth/oauth/google/verify
{
  "idToken": "google_id_token"
}
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/magic-link/send` - Send magic link
- `POST /api/v1/auth/magic-link/verify` - Verify magic link
- `POST /api/v1/auth/oauth/google/verify` - Google OAuth
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/vendors` - List vendors
- `GET /api/v1/users/consumers` - List consumers

### Services
- `GET /api/v1/services/categories` - Get service categories
- `GET /api/v1/services/category/:id` - Get services by category
- `GET /api/v1/services/search` - Search services by location
- `POST /api/v1/services/vendor` - Add vendor service

### Connections
- `POST /api/v1/connections/request` - Request connection
- `PUT /api/v1/connections/:id/accept` - Accept connection
- `GET /api/v1/connections` - List connections

### Messages
- `POST /api/v1/messages/send` - Send message
- `GET /api/v1/messages/conversation/:id` - Get conversation
- `GET /api/v1/messages` - List conversations

### Ratings
- `POST /api/v1/ratings` - Submit rating
- `GET /api/v1/ratings/vendor/:id` - Get vendor ratings

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:auth
npm run test:services
npm run test:connections

# Run with coverage
npm run test:coverage
```

### Manual API Testing
```bash
# Test server health
curl http://localhost:3000/api/v1/health

# Test magic link authentication
curl -X POST http://localhost:3000/api/v1/auth/magic-link/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"LOGIN"}'
```

## 📊 Monitoring

### Health Checks
- `GET /api/v1/health` - Overall system health
- `GET /api/v1/health/database` - Database connectivity
- `GET /api/v1/health/email` - Email service status
- `GET /api/v1/health/redis` - Redis connectivity

### Logging
The application uses structured logging with different levels:
- **Error** - System errors and exceptions
- **Warn** - Warning conditions
- **Info** - General information
- **Debug** - Detailed debugging information

## 🚀 Deployment

### Production Setup
```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies
npm ci --only=production

# Run database migrations
npm run migrate:prod

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t fixrx-backend .

# Run container
docker run -p 3000:3000 --env-file .env fixrx-backend
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run setup:db     # Setup database
npm run migrate      # Run database migrations
npm run seed         # Seed sample data
```

### Code Style
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for quality checks

## 📚 Documentation

### API Documentation
- **Postman Collection** - `FixRx-API-Collection.postman_collection.json`
- **Magic Link Guide** - `MAGIC_LINK_DOCUMENTATION.md`
- **Database Setup** - `DATABASE_SETUP_GUIDE.md`
- **Mobile API Guide** - `MOBILE_API_DOCUMENTATION.md`

### Additional Resources
- [Magic Link Setup Guide](./MAGIC_LINK_SETUP_GUIDE.md)
- [Database Setup Guide](./DATABASE_SETUP_GUIDE.md)
- [Quick Setup Guide](./QUICK_SETUP.md)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Reset database password
sudo -u postgres psql
ALTER USER fixrx_user PASSWORD 'new_password';
```

#### Email Not Sending
- Verify SendGrid API key and configuration
- Check sender email authentication in SendGrid
- Review SendGrid delivery logs

#### Google OAuth Not Working
- Ensure OAuth app is published (not in testing mode)
- Verify authorized domains in Google Console
- Check client ID and secret configuration

#### Rate Limiting Issues
- Check rate limit configuration in environment variables
- Verify IP address detection is working correctly
- Consider adjusting limits for production usage

### Debug Mode
Enable detailed logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Follow existing code style and patterns
- Add JSDoc comments for new functions
- Include unit tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

## 📋 Recent Updates

### Version 2.1.0 (Latest)
- ✅ **Magic Link Authentication** - Complete passwordless login system
- ✅ **Google OAuth Integration** - Social authentication support  
- ✅ **Database Schema Fixes** - Resolved column naming inconsistencies
- ✅ **Email Service Integration** - SendGrid email delivery
- ✅ **Rate Limiting** - Enhanced security measures
- ✅ **Documentation Updates** - Comprehensive setup guides
- ✅ **Code Cleanup** - Removed temporary test files

### Key Fixes Applied
- **Database Schema Consistency** - Fixed camelCase vs snake_case column naming
- **Magic Link Service** - Resolved `lastLoginAt` column reference issue
- **Email Templates** - Professional HTML email designs
- **OAuth Configuration** - Complete Google OAuth setup
- **Security Enhancements** - Improved token validation and rate limiting

---

**FixRx Backend** - Connecting consumers with trusted service providers through technology.
