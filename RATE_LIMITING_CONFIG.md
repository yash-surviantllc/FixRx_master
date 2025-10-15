# 🚦 Rate Limiting Configuration Guide

## 🎯 **Development vs Production Rate Limits**

The FixRx backend now has intelligent rate limiting that automatically adjusts based on your environment.

## ⚙️ **Configuration Options**

### **Option 1: Completely Disable Rate Limiting (Recommended for Development)**
```env
# In Backend/.env file
NODE_ENV=development
DISABLE_RATE_LIMIT=true
```

**Result**: No rate limiting at all - unlimited requests for development and testing.

### **Option 2: Relaxed Rate Limiting (Development Mode)**
```env
# In Backend/.env file
NODE_ENV=development
DISABLE_RATE_LIMIT=false  # or remove this line
```

**Development Limits**:
- **General API**: 1000 requests per 15 minutes
- **Authentication**: 100 requests per 15 minutes  
- **API Endpoints**: 500 requests per minute
- **Search**: 200 requests per minute
- **Upload**: 50 uploads per 5 minutes

### **Option 3: Strict Rate Limiting (Production Mode)**
```env
# In Backend/.env file
NODE_ENV=production
DISABLE_RATE_LIMIT=false  # or remove this line
```

**Production Limits**:
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **API Endpoints**: 60 requests per minute
- **Search**: 30 requests per minute
- **Upload**: 10 uploads per 5 minutes

## 🔧 **How to Apply Changes**

1. **Edit the .env file**:
   ```bash
   cd Backend
   # Edit .env file with your preferred settings
   ```

2. **Restart the backend server**:
   ```bash
   npm run dev
   ```

3. **Verify the configuration**:
   ```bash
   # Run the test script
   node test-rate-limiting.js
   ```

## 📊 **Rate Limiting Endpoints**

The following endpoints have rate limiting applied:

### **Authentication Routes** (`/api/v1/auth/*`)
- OTP send/verify/resend
- Magic link send/verify
- OAuth authentication
- User registration/login

### **API Routes** (`/api/v1/*`)
- User profiles
- Messaging
- Search
- All other API endpoints

### **Search Routes** (`/api/v1/search/*`)
- Vendor search
- Location-based search
- Service category search

### **Upload Routes** (`/api/v1/upload/*`)
- File uploads
- Image uploads
- Document uploads

## 🧪 **Testing Rate Limits**

### **Quick Test**:
```bash
# Test current rate limiting configuration
node test-rate-limiting.js
```

### **Manual Testing**:
```bash
# Send multiple requests quickly
curl -X POST http://localhost:3000/api/v1/auth/otp/health
curl -X POST http://localhost:3000/api/v1/auth/otp/health
curl -X POST http://localhost:3000/api/v1/auth/otp/health
# ... repeat rapidly
```

## 🚨 **Common Issues & Solutions**

### **Issue**: Getting 429 "Rate Limit Exceeded" errors during development

**Solution**:
```env
# Add to Backend/.env
DISABLE_RATE_LIMIT=true
```

### **Issue**: OTP authentication failing due to rate limits

**Solution**:
```env
# Increase auth limits or disable completely
NODE_ENV=development
DISABLE_RATE_LIMIT=true
```

### **Issue**: Chat messaging being rate limited

**Solution**:
```env
# Messaging uses API rate limits - disable for development
DISABLE_RATE_LIMIT=true
```

### **Issue**: Rate limiting not taking effect

**Solution**:
1. Check .env file syntax
2. Restart backend server completely
3. Clear any cached connections

## 📱 **Frontend Impact**

Rate limiting affects these frontend features:

### **Authentication**:
- OTP login/verification
- Magic link authentication
- User registration

### **Messaging**:
- Sending messages
- Loading conversations
- Real-time updates

### **Search**:
- Vendor search
- Location search
- Service browsing

### **File Uploads**:
- Profile pictures
- Document uploads
- Chat attachments

## 🎯 **Recommended Settings**

### **For Development**:
```env
NODE_ENV=development
DISABLE_RATE_LIMIT=true
```
**Why**: Unlimited testing, no interruptions, faster development cycle.

### **For Staging**:
```env
NODE_ENV=development
DISABLE_RATE_LIMIT=false
```
**Why**: Test with relaxed but present rate limits.

### **For Production**:
```env
NODE_ENV=production
# DISABLE_RATE_LIMIT not set (defaults to false)
```
**Why**: Full security with strict rate limits.

## 🔍 **Monitoring Rate Limits**

The backend logs rate limiting events:

```
🚦 Rate Limiting Mode: DEVELOPMENT (Relaxed)
🚦 Rate limiting DISABLED for development
⚠️ Rate limit exceeded: { ip: '127.0.0.1', endpoint: '/api/v1/auth/otp/send', limit: 5 }
```

Watch the console output to see rate limiting in action.

## ✅ **Verification Checklist**

- [ ] .env file updated with desired settings
- [ ] Backend server restarted
- [ ] Rate limiting test script passes
- [ ] OTP authentication works without delays
- [ ] Chat messaging works smoothly
- [ ] No 429 errors during development

Your rate limiting is now optimized for development! 🎉
