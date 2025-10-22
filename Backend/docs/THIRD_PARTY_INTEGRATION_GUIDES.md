# Third-Party Integration Guides

## 🔗 Complete Integration Documentation

This guide provides comprehensive instructions for integrating FixRx with third-party services including Twilio (SMS), SendGrid (Email), Firebase (Push Notifications), and OAuth providers.

## 📱 Twilio SMS Integration

### Setup and Configuration

**1. Create Twilio Account**
- Sign up at [https://www.twilio.com](https://www.twilio.com)
- Get your Account SID and Auth Token from the Console Dashboard
- Purchase a phone number for sending SMS

**2. Environment Configuration**
```bash
# .env file
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**3. Installation**
```bash
npm install twilio
```

**4. Implementation**
```javascript
const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(to, message, options = {}) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
        ...options
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        cost: result.price,
        segments: result.numSegments
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async getMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        price: message.price,
        priceUnit: message.priceUnit,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }

  // Phone number validation and lookup
  async validatePhoneNumber(phoneNumber) {
    try {
      const lookup = await this.client.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch({ type: ['carrier'] });

      return {
        valid: true,
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        carrier: lookup.carrier,
        type: lookup.carrier?.type // mobile, landline, voip
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = TwilioService;
```

**5. Usage Examples**
```javascript
const twilioService = new TwilioService();

// Send SMS
const result = await twilioService.sendSMS(
  '+1234567890',
  'Your FixRx service appointment is confirmed for tomorrow at 2 PM.'
);

// Check delivery status
const status = await twilioService.getMessageStatus(result.messageId);

// Validate phone number
const validation = await twilioService.validatePhoneNumber('+1234567890');
```

### Webhook Configuration
```javascript
// Handle Twilio webhooks for delivery status
app.post('/webhooks/twilio/status', (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;
  
  // Update message status in database
  updateMessageStatus(MessageSid, MessageStatus, ErrorCode);
  
  res.status(200).send('OK');
});
```

## 📧 SendGrid Email Integration

### Setup and Configuration

**1. Create SendGrid Account**
- Sign up at [https://sendgrid.com](https://sendgrid.com)
- Generate an API key from Settings > API Keys
- Verify your sender identity (domain or single sender)

**2. Environment Configuration**
```bash
# .env file
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@fixrx.com
SENDGRID_FROM_NAME=FixRx Team
```

**3. Installation**
```bash
npm install @sendgrid/mail
```

**4. Implementation**
```javascript
const sgMail = require('@sendgrid/mail');

class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(options) {
    const {
      to,
      subject,
      html,
      text,
      templateId,
      dynamicTemplateData,
      attachments
    } = options;

    const msg = {
      to: to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject: subject,
      html: html,
      text: text,
      attachments: attachments
    };

    // Use dynamic template if provided
    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = dynamicTemplateData || {};
      delete msg.html;
      delete msg.text;
      delete msg.subject;
    }

    try {
      const result = await sgMail.send(msg);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        statusCode: result[0].statusCode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async sendBulkEmail(emails) {
    try {
      const result = await sgMail.send(emails);
      return {
        success: true,
        sent: result.length,
        results: result.map(r => ({
          messageId: r.headers['x-message-id'],
          statusCode: r.statusCode
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create and manage templates
  async createTemplate(name, subject, htmlContent) {
    const template = {
      name: name,
      generation: 'dynamic'
    };

    try {
      const response = await sgMail.request({
        method: 'POST',
        url: '/v3/templates',
        body: template
      });

      const templateId = response[1].id;

      // Add version to template
      await sgMail.request({
        method: 'POST',
        url: `/v3/templates/${templateId}/versions`,
        body: {
          template_id: templateId,
          active: 1,
          name: name,
          subject: subject,
          html_content: htmlContent
        }
      });

      return { templateId, success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SendGridService;
```

**5. Email Templates**
```html
<!-- Welcome Email Template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to FixRx</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1>Welcome to FixRx, {{firstName}}!</h1>
        <p>Thank you for joining our platform. We're excited to help you connect with reliable service providers.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
                <li>Complete your profile</li>
                <li>Browse service providers in your area</li>
                <li>Request quotes for your projects</li>
            </ul>
        </div>
        
        <a href="{{appUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Open FixRx App
        </a>
    </div>
</body>
</html>
```

**6. Webhook Configuration**
```javascript
// Handle SendGrid webhooks for email events
app.post('/webhooks/sendgrid/events', (req, res) => {
  const events = req.body;
  
  events.forEach(event => {
    const { sg_message_id, event: eventType, timestamp } = event;
    
    // Update email status in database
    updateEmailStatus(sg_message_id, eventType, timestamp);
  });
  
  res.status(200).send('OK');
});
```

## 🔔 Firebase Push Notifications

### Setup and Configuration

**1. Firebase Project Setup**
- Create project at [https://console.firebase.google.com](https://console.firebase.google.com)
- Enable Cloud Messaging
- Download service account key JSON file

**2. Environment Configuration**
```bash
# .env file
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

**3. Installation**
```bash
npm install firebase-admin
```

**4. Implementation**
```javascript
const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    this.messaging = admin.messaging();
  }

  async sendNotification(deviceToken, notification, data = {}) {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: notification.badge || 1
          }
        }
      }
    };

    try {
      const response = await this.messaging.send(message);
      return {
        success: true,
        messageId: response,
        token: deviceToken
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
  }

  async sendMulticast(tokens, notification, data = {}) {
    const message = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data
    };

    try {
      const response = await this.messaging.sendMulticast(message);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async subscribeToTopic(tokens, topic) {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendToTopic(topic, notification, data = {}) {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data
    };

    try {
      const response = await this.messaging.send(message);
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FirebaseService;
```

**5. Client-Side Integration (React Native)**
```javascript
// React Native Firebase setup
import messaging from '@react-native-firebase/messaging';

// Request permission
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Get FCM token
async function getFCMToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

// Handle foreground messages
messaging().onMessage(async remoteMessage => {
  console.log('Foreground message:', remoteMessage);
  // Display notification in app
});

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);
});
```

## 🔐 OAuth Provider Integration

### Google OAuth 2.0

**1. Setup**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 credentials
- Configure authorized redirect URIs

**2. Configuration**
```bash
# .env file
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**3. Implementation**
```javascript
const { OAuth2Client } = require('google-auth-library');

class GoogleOAuthService {
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = ['profile', 'email'];
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: this.generateState() // CSRF protection
    });
  }

  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async getUserInfo(accessToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: accessToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      throw new Error(`User info retrieval failed: ${error.message}`);
    }
  }

  generateState() {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

### Facebook Login

**1. Setup**
- Create app at [Facebook Developers](https://developers.facebook.com)
- Configure Facebook Login product
- Add valid OAuth redirect URIs

**2. Implementation**
```javascript
const axios = require('axios');

class FacebookOAuthService {
  constructor() {
    this.clientId = process.env.FACEBOOK_CLIENT_ID;
    this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'email,public_profile',
      response_type: 'code',
      state: this.generateState()
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: code
        }
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://graph.facebook.com/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        picture: response.data.picture?.data?.url
      };
    } catch (error) {
      throw new Error(`User info retrieval failed: ${error.message}`);
    }
  }
}
```

## 🔧 Integration Testing

### Testing SMS Integration
```javascript
// Test SMS sending
describe('Twilio SMS Integration', () => {
  test('should send SMS successfully', async () => {
    const twilioService = new TwilioService();
    const result = await twilioService.sendSMS(
      '+1234567890',
      'Test message from FixRx'
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should validate phone number', async () => {
    const twilioService = new TwilioService();
    const result = await twilioService.validatePhoneNumber('+1234567890');

    expect(result.valid).toBe(true);
    expect(result.carrier).toBeDefined();
  });
});
```

### Testing Email Integration
```javascript
// Test email sending
describe('SendGrid Email Integration', () => {
  test('should send email successfully', async () => {
    const sendGridService = new SendGridService();
    const result = await sendGridService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1>'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

### Testing Push Notifications
```javascript
// Test push notification
describe('Firebase Push Notifications', () => {
  test('should send notification successfully', async () => {
    const firebaseService = new FirebaseService();
    const result = await firebaseService.sendNotification(
      'device_token_here',
      {
        title: 'Test Notification',
        body: 'This is a test notification'
      }
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

## 🚨 Error Handling and Monitoring

### Comprehensive Error Handling
```javascript
class IntegrationErrorHandler {
  static handleTwilioError(error) {
    const errorMap = {
      21211: 'Invalid phone number',
      21408: 'Permission to send SMS has not been enabled',
      21610: 'Message body is required'
    };

    return {
      code: error.code,
      message: errorMap[error.code] || error.message,
      retryable: [21211, 21408].includes(error.code) ? false : true
    };
  }

  static handleSendGridError(error) {
    const errorMap = {
      400: 'Bad request - check email format',
      401: 'Unauthorized - check API key',
      403: 'Forbidden - sender not verified'
    };

    return {
      code: error.code,
      message: errorMap[error.code] || error.message,
      retryable: error.code >= 500
    };
  }

  static handleFirebaseError(error) {
    const errorMap = {
      'messaging/invalid-registration-token': 'Invalid device token',
      'messaging/registration-token-not-registered': 'Token not registered',
      'messaging/invalid-payload': 'Invalid message payload'
    };

    return {
      code: error.code,
      message: errorMap[error.code] || error.message,
      retryable: !error.code.includes('invalid')
    };
  }
}
```

### Monitoring and Alerts
```javascript
// Integration health monitoring
class IntegrationMonitor {
  static async checkTwilioHealth() {
    try {
      const twilioService = new TwilioService();
      await twilioService.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return { service: 'twilio', status: 'healthy' };
    } catch (error) {
      return { service: 'twilio', status: 'unhealthy', error: error.message };
    }
  }

  static async checkSendGridHealth() {
    try {
      const response = await axios.get('https://api.sendgrid.com/v3/user/profile', {
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }
      });
      return { service: 'sendgrid', status: 'healthy' };
    } catch (error) {
      return { service: 'sendgrid', status: 'unhealthy', error: error.message };
    }
  }

  static async checkFirebaseHealth() {
    try {
      const firebaseService = new FirebaseService();
      await firebaseService.messaging.send({
        token: 'test_token',
        notification: { title: 'Test', body: 'Test' },
        dryRun: true
      });
      return { service: 'firebase', status: 'healthy' };
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token') {
        return { service: 'firebase', status: 'healthy' }; // Expected for test token
      }
      return { service: 'firebase', status: 'unhealthy', error: error.message };
    }
  }
}
```

## 📋 Best Practices

### Security Best Practices
1. **API Key Management**: Store all API keys in environment variables
2. **Rate Limiting**: Implement rate limiting for all third-party API calls
3. **Webhook Validation**: Validate webhook signatures from third-party services
4. **Error Logging**: Log all integration errors for monitoring and debugging

### Performance Optimization
1. **Connection Pooling**: Reuse HTTP connections for API calls
2. **Caching**: Cache frequently accessed data (templates, user preferences)
3. **Batch Operations**: Use bulk APIs when available (SendGrid, Firebase)
4. **Retry Logic**: Implement exponential backoff for failed requests

### Monitoring and Alerting
1. **Health Checks**: Regular health checks for all integrations
2. **Delivery Tracking**: Monitor delivery rates and success metrics
3. **Error Alerting**: Set up alerts for integration failures
4. **Performance Metrics**: Track response times and throughput

---

*Last updated: October 3, 2024*
*Integration Guide Version: 1.0.0*
