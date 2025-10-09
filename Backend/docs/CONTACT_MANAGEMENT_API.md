# Contact Management & Integration API Documentation

## Overview

The FixRx Contact Management & Integration system provides comprehensive contact management capabilities with bulk operations, device synchronization, and seamless integration with the invitation system. This API supports phone directory access, contact import/export, and advanced communication features with Twilio SMS integration.

## Features

### Core Contact Management
- **Contact CRUD Operations**: Create, read, update, and delete contacts
- **Advanced Search & Filtering**: Search by name, email, phone, company, tags
- **Contact Organization**: Tags, favorites, notes, and custom categorization
- **Contact Validation**: Phone number and email format validation

### Bulk Operations
- **Mass Contact Import**: CSV file import with batch processing
- **Bulk Invitation System**: Send invitations to multiple contacts simultaneously
- **Batch Management**: Track import/export operations with detailed analytics

### Device Integration
- **Contact Synchronization**: Sync contacts across devices
- **Phone Directory Access**: Import contacts from device address book
- **Conflict Resolution**: Handle duplicate contacts intelligently

### Communication Services
- **Twilio SMS Integration**: Send SMS with delivery tracking
- **A2P 10DLC Compliance**: Rate limiting (1 MPS default)
- **Multi-channel Invitations**: SMS, Email, or both delivery methods
- **Delivery Status Tracking**: Real-time status monitoring

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Contact Management

#### Get Contacts
```http
GET /api/v1/contacts
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `search` (string, optional): Search term for name, email, phone, company
- `tags` (string, optional): Comma-separated list of tags to filter by
- `source` (string, optional): Filter by contact source (manual, imported, synced)
- `favorites` (boolean, optional): Filter by favorite status
- `sortBy` (string, optional): Sort field (first_name, last_name, email, phone, company, created_at)
- `sortOrder` (string, optional): Sort direction (ASC, DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "company": "Example Corp",
      "job_title": "Manager",
      "source": "manual",
      "is_favorite": false,
      "tags": ["client", "priority"],
      "notes": "Important client contact",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### Create Contact
```http
POST /api/v1/contacts
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "company": "Example Corp",
  "jobTitle": "Manager",
  "tags": ["client", "priority"],
  "notes": "Important client contact",
  "isFavorite": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "company": "Example Corp",
    "job_title": "Manager",
    "source": "manual",
    "is_favorite": false,
    "tags": ["client", "priority"],
    "notes": "Important client contact",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Contact created successfully"
}
```

#### Update Contact
```http
PUT /api/v1/contacts/:id
```

**Request Body:** Same as Create Contact

#### Delete Contact
```http
DELETE /api/v1/contacts/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "deletedId": "uuid"
  },
  "message": "Contact deleted successfully"
}
```

### Bulk Operations

#### Bulk Create Contacts
```http
POST /api/v1/contacts/bulk
```

**Request Body:**
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+0987654321",
      "email": "jane@example.com"
    }
  ],
  "batchName": "Q1 2024 Contacts"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": 150,
    "failed": 5,
    "duplicates": 10,
    "details": {
      "successful": [...],
      "failed": [...],
      "duplicates": [...]
    }
  },
  "message": "Bulk operation completed: 150 created, 5 failed, 10 duplicates"
}
```

#### Import Contacts from File
```http
POST /api/v1/contacts/import
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `contactFile`: CSV file containing contacts
- `batchName`: Optional batch name for tracking

**CSV Format:**
```csv
First Name,Last Name,Phone,Email,Company,Job Title
John,Doe,+1234567890,john@example.com,Example Corp,Manager
Jane,Smith,+0987654321,jane@example.com,Another Corp,Director
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "totalProcessed": 100,
    "successful": 95,
    "failed": 3,
    "duplicates": 2
  },
  "message": "Import completed: 95 contacts imported successfully"
}
```

#### Export Contacts
```http
GET /api/v1/contacts/export
```

**Query Parameters:** Same filtering options as Get Contacts

**Response:** CSV file download

### Contact Analytics

#### Get Contact Statistics
```http
GET /api/v1/contacts/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_contacts": "500",
    "favorites": "50",
    "imported": "300",
    "manual": "200",
    "with_phone": "480",
    "with_email": "450"
  },
  "message": "Contact statistics retrieved successfully"
}
```

#### Get Import Batches
```http
GET /api/v1/contacts/import-batches
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "batch_name": "Q1 2024 Import",
      "total_contacts": 100,
      "processed_contacts": 100,
      "successful_imports": 95,
      "failed_imports": 5,
      "status": "completed",
      "import_source": "csv",
      "created_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:05:00Z"
    }
  ],
  "message": "Retrieved 5 import batches"
}
```

### Contact Synchronization

#### Sync Contacts from Device
```http
POST /api/v1/contacts/sync
```

**Request Body:**
```json
{
  "deviceContacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": 45,
    "failed": 2,
    "duplicates": 8,
    "details": {
      "successful": [...],
      "failed": [...],
      "duplicates": [...]
    }
  },
  "message": "Sync completed: 45 contacts synced successfully"
}
```

#### Search Contacts by Identifier
```http
GET /api/v1/contacts/search/:identifier
```

**Parameters:**
- `identifier`: Phone number or email address

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    }
  ],
  "message": "Found 1 contacts matching identifier"
}
```

## Invitation System

### Create Single Invitation
```http
POST /api/v1/invitations
```

**Request Body:**
```json
{
  "recipientEmail": "john@example.com",
  "recipientPhone": "+1234567890",
  "recipientName": "John Doe",
  "message": "Join our platform for amazing services!",
  "invitationType": "vendor_invite",
  "deliveryMethod": "both",
  "expiresIn": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "recipient_email": "john@example.com",
    "recipient_phone": "+1234567890",
    "status": "sent",
    "invite_token": "secure-token",
    "expires_at": "2024-01-08T00:00:00Z",
    "deliveryResults": {
      "email": {
        "id": "email-id",
        "status": "sent"
      },
      "sms": {
        "id": "sms-id",
        "status": "sent"
      },
      "errors": []
    }
  },
  "message": "Invitation created and sent successfully"
}
```

### Bulk Invitations
```http
POST /api/v1/invitations/bulk
```

**Request Body:**
```json
{
  "invitations": [
    {
      "recipientEmail": "john@example.com",
      "recipientName": "John Doe",
      "message": "Custom message for John"
    },
    {
      "recipientPhone": "+1234567890",
      "recipientName": "Jane Smith"
    }
  ],
  "options": {
    "batchName": "Q1 2024 Vendor Outreach",
    "deliveryMethod": "email",
    "invitationType": "vendor_invite",
    "message": "Default message for all invitations",
    "expiresIn": 14
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "summary": {
      "total": 100,
      "successful": 95,
      "failed": 3,
      "duplicates": 2
    },
    "details": {
      "successful": [...],
      "failed": [...],
      "duplicates": [...]
    }
  },
  "message": "Bulk invitation completed: 95 sent, 3 failed, 2 duplicates"
}
```

### Resend Invitation
```http
POST /api/v1/invitations/:id/resend
```

**Request Body:**
```json
{
  "deliveryMethod": "sms",
  "newMessage": "Updated invitation message"
}
```

### Accept Invitation (Public Endpoint)
```http
POST /api/v1/invitations/accept/:token
```

**Request Body:**
```json
{
  "userType": "vendor",
  "additionalData": {
    "source": "mobile_app"
  }
}
```

### Get Invitation Analytics
```http
GET /api/v1/invitations/analytics
```

**Query Parameters:**
- `startDate` (string, optional): Start date (ISO format)
- `endDate` (string, optional): End date (ISO format)
- `invitationType` (string, optional): Filter by invitation type

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInvitations": 500,
    "sent": 480,
    "accepted": 120,
    "expired": 50,
    "failed": 20,
    "acceptanceRate": "25.00",
    "deliveryMethods": {
      "email": 300,
      "sms": 150,
      "both": 50
    },
    "avgAcceptanceTimeHours": "48.50"
  },
  "message": "Invitation analytics retrieved successfully"
}
```

## SMS Integration

### Send SMS
```http
POST /api/v1/sms/send
```

**Request Body:**
```json
{
  "to": "+1234567890",
  "body": "Your message here",
  "templateId": "uuid",
  "variables": {
    "name": "John",
    "code": "123456"
  },
  "priority": "normal"
}
```

### Get SMS Status
```http
GET /api/v1/sms/:smsId/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "delivered",
    "to": "+1234567890",
    "body": "Your message here",
    "cost": 0.0075,
    "segments": 1,
    "sentAt": "2024-01-01T00:00:00Z",
    "deliveredAt": "2024-01-01T00:00:05Z",
    "twilioSid": "twilio-message-id"
  },
  "message": "SMS status retrieved successfully"
}
```

### Bulk SMS
```http
POST /api/v1/sms/bulk
```

**Request Body:**
```json
{
  "messages": [
    {
      "to": "+1234567890",
      "body": "Message for John"
    },
    {
      "to": "+0987654321",
      "body": "Message for Jane"
    }
  ],
  "options": {
    "batchName": "Marketing Campaign",
    "templateId": "uuid",
    "priority": "normal"
  }
}
```

## Rate Limiting

The API implements multi-tier rate limiting:

- **Contact Operations**: 200 requests per 15 minutes
- **Bulk Operations**: 10 requests per hour
- **Import Operations**: 10 requests per hour
- **Resend Operations**: 20 requests per 15 minutes
- **SMS Operations**: 1 message per second (A2P 10DLC compliance)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Data Validation

### Contact Validation Rules

- **Phone Number**: Must be valid international format (E.164)
- **Email**: Must be valid email format
- **Required Fields**: At least one of phone or email must be provided
- **Name Fields**: Maximum 100 characters each
- **Company**: Maximum 255 characters
- **Notes**: Maximum 1000 characters
- **Tags**: Array of strings, maximum 50 tags per contact

### File Upload Limits

- **File Size**: Maximum 5MB per file
- **File Types**: CSV, VCF, TXT
- **Batch Size**: Maximum 1000 contacts per import
- **Sync Limit**: Maximum 5000 contacts per sync operation

## Security Features

### Data Protection
- All contact data is encrypted at rest
- Phone numbers are normalized and validated
- Email addresses are normalized to lowercase
- Duplicate detection prevents data redundancy

### Access Control
- User-scoped data access (users can only access their own contacts)
- JWT token validation for all protected endpoints
- Rate limiting to prevent abuse
- Input sanitization and validation

### Audit Trail
- All contact operations are logged
- Import/export activities are tracked
- Invitation actions are recorded with timestamps
- SMS delivery status is monitored

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Create contact
const createContact = async (contactData, token) => {
  try {
    const response = await axios.post(
      'https://api.fixrx.com/api/v1/contacts',
      contactData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error.response.data);
    throw error;
  }
};

// Bulk invite contacts
const bulkInvite = async (invitations, options, token) => {
  try {
    const response = await axios.post(
      'https://api.fixrx.com/api/v1/invitations/bulk',
      { invitations, options },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending bulk invitations:', error.response.data);
    throw error;
  }
};
```

### React Native
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class ContactService {
  static async getContacts(filters = {}) {
    const token = await AsyncStorage.getItem('auth_token');
    const queryParams = new URLSearchParams(filters).toString();
    
    const response = await fetch(
      `https://api.fixrx.com/api/v1/contacts?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.json();
  }

  static async syncDeviceContacts(deviceContacts) {
    const token = await AsyncStorage.getItem('auth_token');
    
    const response = await fetch(
      'https://api.fixrx.com/api/v1/contacts/sync',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceContacts })
      }
    );
    
    return response.json();
  }
}
```

## Best Practices

### Contact Management
1. **Validate Data**: Always validate phone numbers and emails before submission
2. **Use Tags**: Organize contacts with meaningful tags for better filtering
3. **Batch Operations**: Use bulk operations for importing large contact lists
4. **Regular Sync**: Implement periodic device contact synchronization
5. **Handle Duplicates**: Check for existing contacts before creating new ones

### Invitation System
1. **Personalize Messages**: Use custom messages for better engagement
2. **Choose Delivery Method**: Select appropriate delivery method based on contact preferences
3. **Monitor Analytics**: Track invitation performance and optimize accordingly
4. **Set Expiration**: Use appropriate expiration times for different invitation types
5. **Handle Failures**: Implement retry logic for failed deliveries

### SMS Integration
1. **Respect Rate Limits**: Comply with A2P 10DLC requirements (1 MPS default)
2. **Use Templates**: Leverage SMS templates for consistent messaging
3. **Track Delivery**: Monitor SMS delivery status and handle failures
4. **Cost Management**: Monitor SMS costs and segment usage
5. **Compliance**: Ensure compliance with SMS regulations and opt-out requirements

## Support

For technical support and questions:
- **Documentation**: [https://docs.fixrx.com](https://docs.fixrx.com)
- **API Support**: api-support@fixrx.com
- **Developer Portal**: [https://developers.fixrx.com](https://developers.fixrx.com)

## Changelog

### Version 1.0.0 (Current)
- Initial release of Contact Management & Integration API
- Full CRUD operations for contacts
- Bulk import/export functionality
- Device contact synchronization
- Comprehensive invitation system
- Twilio SMS integration with A2P 10DLC compliance
- Multi-channel invitation delivery
- Real-time analytics and reporting
