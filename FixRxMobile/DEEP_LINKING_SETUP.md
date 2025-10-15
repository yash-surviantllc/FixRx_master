# Deep Linking Setup Guide

## Overview

This guide covers the configuration and troubleshooting of deep linking for magic link authentication in FixRx Mobile.

## Configuration

### 1. Environment Variables

#### Mobile App

Run the automated setup script:
```bash
npm run setup
```

Or manually create `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:3000/api/v1
EXPO_PUBLIC_APP_SCHEME=fixrx
EXPO_PUBLIC_APP_DOMAIN=fixrx.com
```

#### Backend

Update `Backend/.env`:
```env
FRONTEND_URL=fixrx://
APP_SCHEME=fixrx
```

### 2. URL Scheme

- **Development**: `fixrx://magic-link?token=...&email=...`
- **Production**: `https://fixrx.com/auth/magic-link?token=...&email=...`

## Testing

### Android (ADB)
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "fixrx://magic-link?token=test123&email=test@example.com" \
  com.fixrx.mobile
```

### Expo Developer Menu
1. Press `d` in Metro bundler terminal
2. Select "Open URL"
3. Enter: `fixrx://magic-link?token=test123&email=test@example.com`

## Troubleshooting

### Localhost Error in Email Links
- Verify backend `.env` has `FRONTEND_URL=fixrx://`
- Restart backend server
- Clear app cache: `npm start -- -c`

### Deep Link Doesn't Open App
- Rebuild the app: `npm run android` or `npm run ios`
- Verify app is installed on device

### Can't Connect to Backend
- Ensure device and computer are on same WiFi network
- Check firewall allows connections on port 3000
- Run `npm run setup` to auto-detect correct IP address

### Metro Bundler Errors
```bash
npm run reset
```

## Network Setup

### Find Your Local IP

**Windows**: `ipconfig`  
**Mac/Linux**: `ifconfig`

Use this IP in your `.env` file or run `npm run setup` for automatic configuration.

## Production Deployment

- Update `FRONTEND_URL` to `https://fixrx.com`
- Configure Universal Links (iOS) and App Links (Android)
- Update bundle identifiers in `app.json`
- Test deep links on production domain

## Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Android App Links](https://developer.android.com/training/app-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
