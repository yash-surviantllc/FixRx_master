# FixRx Mobile App API Documentation

## 🎯 Overview

Complete API documentation for FixRx React Native mobile app integration. All endpoints are now implemented and tested.

**Base URL**: `http://localhost:3000/api/v1`

## 🔐 Authentication

Most endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📱 Mobile App Endpoints

### 🏥 Health & System

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-05T13:59:03.193Z",
  "uptime": 123.45,
  "memory": {...},
  "version": "1.0.0"
}
```

---

### 🔐 Authentication

#### User Registration
```http
POST /api/v1/auth/register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "CONSUMER", // or "VENDOR"
  "phone": "+1234567890",
  "metroArea": "San Francisco Bay Area"
}
```

#### User Login
```http
POST /api/v1/auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### User Logout
```http
POST /api/v1/auth/logout
```
**Headers:** `Authorization: Bearer <token>`

---

### 👤 User Profile

#### Get User Profile
```http
GET /api/v1/users/profile
```
**Headers:** `Authorization: Bearer <token>`

#### Update User Profile
```http
PUT /api/v1/users/profile
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "phone": "+1234567890",
  "metroArea": "Los Angeles"
}
```

---

### 📋 Service Categories & Services

#### Get All Service Categories
```http
GET /api/v1/services/categories
```
**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Plumbing",
        "description": "Plumbing services including repairs...",
        "icon_url": null,
        "sort_order": 1
      }
    ]
  }
}
```

#### Get Services by Category
```http
GET /api/v1/services/categories/:categoryId/services
```
**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "Leak Repair",
        "description": "Fix leaking pipes, faucets...",
        "category_name": "Plumbing"
      }
    ]
  }
}
```

---

### 🔧 Vendor Management

#### Create Vendor Profile
```http
POST /api/v1/vendors/profile
```
**Headers:** `Authorization: Bearer <token>` (Vendor role required)
**Body:**
```json
{
  "businessName": "ABC Plumbing Co",
  "businessDescription": "Professional plumbing services",
  "businessPhone": "+1234567890",
  "businessEmail": "contact@abcplumbing.com",
  "serviceCategories": ["plumbing", "hvac"],
  "hourlyRateMin": 50,
  "hourlyRateMax": 150
}
```

#### Get Vendor Profile
```http
GET /api/v1/vendors/:vendorId/profile
```
**Public endpoint** - No authentication required

---

### 🏠 Consumer Dashboard

#### Get Consumer Dashboard
```http
GET /api/v1/consumers/dashboard
```
**Headers:** `Authorization: Bearer <token>` (Consumer role required)
**Response:**
```json
{
  "success": true,
  "data": {
    "activeServices": 2,
    "completedServices": 15,
    "savedVendors": 8,
    "recentActivity": []
  }
}
```

---

### 🔍 Search & Discovery

#### Search Vendors
```http
POST /api/v1/search/vendors
```
**Body:**
```json
{
  "serviceType": "plumbing",
  "location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "radiusKm": 10
}
```

#### Find Nearby Vendors
```http
GET /api/v1/search/nearby?lat=37.7749&lng=-122.4194&radius=10&limit=20
```

---

### 🤝 Connection Requests

#### Create Connection Request
```http
POST /api/v1/connections/request
```
**Headers:** `Authorization: Bearer <token>` (Consumer role required)
**Body:**
```json
{
  "vendorId": "vendor-uuid",
  "serviceId": "service-uuid",
  "message": "I need plumbing help",
  "projectDescription": "Kitchen sink is leaking",
  "budgetMin": 100,
  "budgetMax": 300,
  "preferredStartDate": "2025-10-10",
  "urgency": "HIGH"
}
```

#### Get Connection Requests
```http
GET /api/v1/connections/requests
```
**Headers:** `Authorization: Bearer <token>`
**Response:** Different based on user type (Consumer sees sent requests, Vendor sees received requests)

#### Update Connection Request Status
```http
PUT /api/v1/connections/requests/:requestId/status
```
**Headers:** `Authorization: Bearer <token>` (Vendor role required)
**Body:**
```json
{
  "status": "ACCEPTED" // or "DECLINED"
}
```

---

### 💬 Messages

#### Send Message
```http
POST /api/v1/messages/send
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "recipientId": "user-uuid",
  "content": "Hello, I have a question about your services",
  "connectionRequestId": "request-uuid", // optional
  "messageType": "TEXT"
}
```

#### Get Conversations
```http
GET /api/v1/messages/conversations
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "other_user_id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe",
        "last_message": "Thank you for your service",
        "last_message_at": "2025-10-05T13:59:03.193Z",
        "unread_count": 2
      }
    ]
  }
}
```

#### Get Conversation Messages
```http
GET /api/v1/messages/conversation/:userId?limit=50&offset=0
```
**Headers:** `Authorization: Bearer <token>`

---

### ⭐ Ratings & Reviews

#### Create Rating
```http
POST /api/v1/ratings/create
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "ratedUserId": "vendor-uuid",
  "connectionRequestId": "request-uuid",
  "overallRating": 5,
  "costRating": 4,
  "qualityRating": 5,
  "timelinessRating": 4,
  "professionalismRating": 5,
  "reviewText": "Excellent service! Very professional and timely."
}
```

#### Get User Ratings
```http
GET /api/v1/ratings/user/:userId
```
**Public endpoint** - No authentication required
**Response:**
```json
{
  "success": true,
  "data": {
    "ratings": [...],
    "averages": {
      "avg_overall": 4.5,
      "avg_cost": 4.2,
      "avg_quality": 4.7,
      "avg_timeliness": 4.3,
      "avg_professionalism": 4.8,
      "total_ratings": 25
    }
  }
}
```

---

### 🔔 Notifications

#### Get Notifications
```http
GET /api/v1/notifications?limit=20&offset=0
```
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

#### Mark Notification as Read
```http
PUT /api/v1/notifications/:notificationId/read
```
**Headers:** `Authorization: Bearer <token>`

---

### 📱 Communication

#### Send SMS
```http
POST /api/v1/communications/sms/send
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Your service request has been accepted",
  "priority": "normal"
}
```

#### Send Email
```http
POST /api/v1/communications/email/send
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "to": "user@example.com",
  "subject": "Service Update",
  "content": "Your service request has been processed",
  "priority": "normal"
}
```

---

## 📊 Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access** - Consumer/Vendor/Admin role separation
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive input validation
- **CORS Protection** - Cross-origin request protection
- **Security Headers** - Helmet.js security headers

## 📱 Mobile App Integration

### Required Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${userToken}` // For protected endpoints
};
```

### Error Handling
```javascript
try {
  const response = await fetch(`${API_BASE_URL}/endpoint`, {
    method: 'GET',
    headers
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Handle success
    console.log(data.data);
  } else {
    // Handle API error
    console.error(data.error.message);
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error.message);
}
```

## 🎯 Mobile App Features Supported

✅ **User Authentication** - Registration, login, logout  
✅ **User Profiles** - View and update profiles  
✅ **Service Discovery** - Browse categories and services  
✅ **Vendor Search** - Location-based vendor search  
✅ **Connection Requests** - Consumer-vendor connections  
✅ **Real-time Messaging** - User-to-user communication  
✅ **Ratings & Reviews** - Multi-category rating system  
✅ **Notifications** - Push and in-app notifications  
✅ **Role-based Access** - Consumer and Vendor workflows  
✅ **Communication** - SMS and Email integration  

## 🚀 Ready for Production

Your FixRx backend API is now **complete and production-ready** with all endpoints required for your React Native mobile app!

**Backend Server**: `http://localhost:3000`  
**API Base URL**: `http://localhost:3000/api/v1`  
**Database**: PostgreSQL with sample data  
**Authentication**: JWT with Auth0 integration  
**Status**: ✅ **FULLY OPERATIONAL**
