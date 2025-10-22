# FixRx Backend Integration Guide

## 🎯 Overview

This guide provides **optional backend integration** for the FixRx mobile app. All services are designed to be **non-intrusive** and work alongside existing mock data without requiring changes to existing screens.

## 📁 Files Added

### Core Integration Files
- `src/config/api.ts` - API configuration and endpoints
- `src/services/apiClient.ts` - HTTP client with fallback support
- `src/services/authService.ts` - Authentication service
- `src/services/consumerService.ts` - Consumer-specific operations
- `src/services/vendorService.ts` - Vendor-specific operations
- `src/services/ratingService.ts` - Rating system service
- `src/services/invitationService.ts` - Invitation system service
- `src/services/index.ts` - Service exports and initialization

## 🔄 How It Works

### Automatic Fallback System
Each service automatically detects if the backend is available:
- ✅ **Backend Available**: Uses real API data
- ❌ **Backend Unavailable**: Falls back to mock data
- 🔄 **Seamless**: No code changes needed in existing screens

### Example Usage (Optional)

```typescript
// In any existing screen, you can optionally use services
import { consumerService } from '../services';

// This will use backend if available, mock data if not
const dashboardData = await consumerService.getDashboard();
```

## 🚀 Backend Server Setup

### Start Test Server
```bash
cd Backend
node test-server.js
```

The server runs on `http://localhost:3000` with these endpoints:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/consumers/dashboard` - Consumer dashboard
- `GET /api/v1/users/profile` - User profile
- And more...

## 🎨 Frontend Integration (Optional)

### Option 1: Keep Existing Code (Recommended)
- No changes needed to existing screens
- Services are available if needed
- Mock data continues to work

### Option 2: Gradual Integration
Replace mock data calls with service calls:

```typescript
// Before (existing mock data)
const contractors = [
  { id: '1', name: 'Mike Rodriguez', ... }
];

// After (optional service integration)
const response = await consumerService.getDashboard();
const contractors = response.data?.recommendedVendors || [];
```

### Option 3: Service Initialization
Add to App.tsx (optional):

```typescript
import { initializeServices } from './src/services';

// In App component
useEffect(() => {
  initializeServices();
}, []);
```

## 🔧 Configuration

### API Base URL
Update in `src/config/api.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api/v1', // Change as needed
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
```

### Environment Variables (Optional)
Create `.env` file:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_API_TIMEOUT=10000
```

## 📱 Testing

### 1. Test Backend Connection
```typescript
import { apiClient } from './src/services';

const testConnection = async () => {
  const isAvailable = await apiClient.isBackendAvailable();
  console.log('Backend available:', isAvailable);
};
```

### 2. Test Services
```typescript
import { authService, consumerService } from './src/services';

// Test authentication
const loginResult = await authService.login({
  email: 'test@example.com',
  password: 'password123'
});

// Test consumer dashboard
const dashboardData = await consumerService.getDashboard();
```

## 🛡️ Error Handling

Services automatically handle errors:
- Network failures → Falls back to mock data
- Server errors → Returns error response
- Timeout → Retries then falls back

## 📊 Service Features

### Authentication Service
- Login/Register with JWT tokens
- Automatic token storage
- Session management
- Profile management

### Consumer Service
- Dashboard data with vendor recommendations
- Vendor search and filtering
- Service history
- Connection management

### Vendor Service
- Vendor dashboard with stats
- Connection requests
- Profile management
- Service offerings

### Rating Service
- Four-category rating system (Cost, Quality, Timeliness, Professionalism)
- Rating CRUD operations
- Rating statistics
- Pending ratings

### Invitation Service
- Single and bulk invitations
- SMS/Email support
- Invitation tracking
- Response handling

## 🎯 Benefits

1. **Non-Intrusive**: Existing code continues to work
2. **Gradual Migration**: Integrate at your own pace
3. **Fallback Support**: Always works, even without backend
4. **Type Safety**: Full TypeScript support
5. **Error Handling**: Comprehensive error management
6. **Testing Ready**: Easy to test and debug

## 🔄 Migration Strategy

1. **Phase 1**: Keep existing mock data (current state)
2. **Phase 2**: Start backend server for testing
3. **Phase 3**: Gradually replace mock calls with service calls
4. **Phase 4**: Full backend integration

## 📞 Support

- Backend runs on: `http://localhost:3000`
- Health check: `http://localhost:3000/api/v1/health`
- All services have mock fallbacks
- No frontend changes required

---

**Note**: This integration is completely optional. The existing frontend will continue to work exactly as before, with the added benefit of backend connectivity when available.
