# FixRx API Documentation

## 📚 Complete API Reference Guide

Welcome to the comprehensive FixRx API documentation. This guide provides detailed information about all available endpoints, request/response formats, authentication methods, and integration examples.

## 🔗 Base URL

```
Production: https://api.fixrx.com/api/v1
Development: http://localhost:3000/api/v1
```

## 🔐 Authentication

### JWT Token Authentication
All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### OAuth Authentication
FixRx supports multiple OAuth providers:
- Google OAuth 2.0
- Facebook Login
- GitHub OAuth
- LinkedIn OAuth

## 📊 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-10-03T13:49:28Z",
    "version": "1.0.0"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  },
  "meta": {
    "timestamp": "2024-10-03T13:49:28Z",
    "version": "1.0.0"
  }
}
```

## 🏥 System Health & Monitoring

### GET /system/health
Get comprehensive system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "version": "1.0.0",
    "services": {
      "database": { "status": "connected", "responseTime": 15 },
      "redis": { "status": "connected", "hitRate": 87.3 },
      "twilio": { "status": "operational", "deliveryRate": 98.5 },
      "sendgrid": { "status": "operational", "deliveryRate": 96.8 },
      "firebase": { "status": "operational", "deliveryRate": 94.2 }
    }
  }
}
```

### GET /system/metrics
Get detailed system performance metrics.

**Query Parameters:**
- `period` (optional): Time period for metrics (1h, 24h, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "api": {
      "totalRequests": 15420,
      "successRate": 97.2,
      "averageResponseTime": 245
    },
    "database": {
      "queries": { "total": 8945, "averageTime": 15.3 },
      "performance": { "cacheHitRate": 89.2 }
    },
    "users": {
      "activeUsers": 234,
      "concurrentUsers": 45
    }
  }
}
```

## 👤 Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "consumer" // or "vendor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "consumer"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

### POST /auth/login
Authenticate user and get access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### POST /auth/oauth/:provider
Authenticate using OAuth provider (google, facebook, github, linkedin).

**Request Body:**
```json
{
  "code": "oauth_authorization_code",
  "state": "csrf_protection_state",
  "redirectUri": "https://yourapp.com/auth/callback"
}
```

## 🏢 Vendor Management

### POST /vendors/profile
Create a new vendor profile.

**Authentication:** Required
**Request Body:**
```json
{
  "firstName": "Mike",
  "lastName": "Rodriguez",
  "businessName": "Rodriguez Plumbing Services",
  "email": "mike@rodriguezplumbing.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701",
    "country": "USA"
  },
  "services": ["plumbing", "emergency_repair"],
  "description": "Professional plumbing services with 15+ years experience"
}
```

### GET /vendors/:vendorId/profile
Get vendor profile information.

**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "businessName": "Rodriguez Plumbing Services",
    "rating": 4.8,
    "totalReviews": 127,
    "services": ["plumbing", "emergency_repair"],
    "verified": true,
    "joinedDate": "2024-01-15T00:00:00Z"
  }
}
```

### GET /vendors/search
Search for vendors with filters.

**Query Parameters:**
- `service` (optional): Service type filter
- `location` (optional): Location filter
- `rating` (optional): Minimum rating filter
- `radius` (optional): Search radius in miles
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor_123",
        "businessName": "Rodriguez Plumbing Services",
        "rating": 4.8,
        "distance": 2.3,
        "services": ["plumbing"],
        "availability": "available"
      }
    ],
    "total": 45,
    "hasMore": true
  }
}
```

## ⭐ Rating & Review System

### POST /ratings
Create a new rating and review.

**Authentication:** Required
**Request Body:**
```json
{
  "vendorId": "vendor_123",
  "serviceId": "service_456",
  "ratings": {
    "cost": 4,
    "quality": 5,
    "timeliness": 4,
    "professionalism": 5
  },
  "comment": "Excellent service! Very professional and completed the job on time.",
  "images": ["https://example.com/image1.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rating_789",
    "overallRating": 4.5,
    "ratings": {
      "cost": 4,
      "quality": 5,
      "timeliness": 4,
      "professionalism": 5
    },
    "comment": "Excellent service!",
    "createdAt": "2024-10-03T13:49:28Z"
  }
}
```

### GET /ratings
Get ratings with filtering options.

**Query Parameters:**
- `vendorId` (optional): Filter by vendor
- `consumerId` (optional): Filter by consumer
- `minRating` (optional): Minimum rating filter
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

## 📱 Mobile Application APIs

### GET /mobile/config
Get mobile app configuration.

**Query Parameters:**
- `platform`: ios or android
- `appVersion`: App version number

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "ios",
    "features": {
      "offlineMode": true,
      "pushNotifications": true,
      "biometricAuth": true
    },
    "performance": {
      "maxCacheSize": 100,
      "syncInterval": 300
    }
  }
}
```

### POST /mobile/sync
Synchronize offline data.

**Authentication:** Required
**Request Body:**
```json
{
  "userId": "user_123",
  "deviceId": "device_abc",
  "lastSyncTime": "2024-10-03T10:00:00Z",
  "pendingActions": [
    {
      "type": "rating_create",
      "data": { "vendorId": "vendor_1", "rating": 5 }
    }
  ]
}
```

## 🔔 Push Notifications

### POST /notifications/push/send
Send push notification.

**Authentication:** Required
**Request Body:**
```json
{
  "userId": "user_123",
  "title": "Service Request Update",
  "body": "Your plumbing service request has been accepted",
  "data": {
    "serviceId": "service_456",
    "action": "service_accepted"
  },
  "priority": "high"
}
```

### GET /notifications/history/:userId
Get user's notification history.

**Authentication:** Required
**Query Parameters:**
- `limit` (optional): Number of notifications
- `offset` (optional): Pagination offset
- `category` (optional): Filter by category

## 📧 Communication APIs

### POST /sms/send
Send SMS message.

**Authentication:** Required
**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your service appointment is confirmed for tomorrow at 2 PM",
  "templateId": "appointment_confirmation"
}
```

### POST /email/send
Send email message.

**Authentication:** Required
**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Service Confirmation",
  "templateId": "service_confirmation",
  "variables": {
    "customerName": "John Doe",
    "serviceDate": "2024-10-04"
  }
}
```

## 📊 Rate Limiting

FixRx implements multi-tier rate limiting:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Specific APIs**: 60 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696348800
```

## 🔍 Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Rate limit exceeded |
| `SERVER_ERROR` | Internal server error |

## 📝 Request Examples

### cURL Examples

**Get System Health:**
```bash
curl -X GET "http://localhost:3000/api/v1/system/health" \
  -H "Content-Type: application/json"
```

**Create Rating:**
```bash
curl -X POST "http://localhost:3000/api/v1/ratings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "vendorId": "vendor_123",
    "ratings": {
      "cost": 4,
      "quality": 5,
      "timeliness": 4,
      "professionalism": 5
    },
    "comment": "Great service!"
  }'
```

### JavaScript/Axios Examples

**Authentication:**
```javascript
const response = await axios.post('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

const { accessToken } = response.data.data.tokens;
```

**Vendor Search:**
```javascript
const vendors = await axios.get('/api/v1/vendors/search', {
  params: {
    service: 'plumbing',
    location: 'Austin, TX',
    radius: 10
  },
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

## 🔧 SDK and Libraries

### JavaScript/Node.js SDK
```javascript
import FixRxAPI from '@fixrx/api-client';

const client = new FixRxAPI({
  baseURL: 'https://api.fixrx.com/api/v1',
  apiKey: 'your_api_key'
});

// Search vendors
const vendors = await client.vendors.search({
  service: 'plumbing',
  location: 'Austin, TX'
});
```

### React Native Integration
```javascript
import { FixRxProvider, useFixRx } from '@fixrx/react-native';

function App() {
  return (
    <FixRxProvider apiKey="your_api_key">
      <YourApp />
    </FixRxProvider>
  );
}

function VendorList() {
  const { vendors, loading } = useFixRx().vendors.search({
    service: 'plumbing'
  });
  
  return (
    <View>
      {vendors.map(vendor => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </View>
  );
}
```

## 🚀 Getting Started

1. **Register for API Access**: Sign up at [https://developer.fixrx.com](https://developer.fixrx.com)
2. **Get API Keys**: Generate your API keys from the developer dashboard
3. **Test with Postman**: Import our Postman collection for easy testing
4. **Integrate**: Use our SDKs or make direct HTTP requests
5. **Go Live**: Switch to production endpoints when ready

## 📞 Support

- **Documentation**: [https://docs.fixrx.com](https://docs.fixrx.com)
- **API Status**: [https://status.fixrx.com](https://status.fixrx.com)
- **Developer Support**: [developer-support@fixrx.com](mailto:developer-support@fixrx.com)
- **Community Forum**: [https://community.fixrx.com](https://community.fixrx.com)

## 📋 Changelog

### Version 1.0.0 (Current)
- Initial API release
- Complete vendor management system
- Four-category rating system
- Push notification support
- OAuth authentication
- Mobile app APIs

---

*Last updated: October 3, 2024*
*API Version: 1.0.0*
