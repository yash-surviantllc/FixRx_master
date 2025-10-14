# FixRx Mobile Application

## Overview

FixRx Mobile is a React Native application built with Expo, connecting homeowners with trusted contractors for home service management.

## Quick Start

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- Expo Go app (for device testing)
- Android Studio (for Android) or Xcode (for iOS on Mac)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your platform:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (Mac only)
   - Press `w` for web browser
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
FixRxMobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── consumer/        # Consumer-specific screens
│   │   └── vendor/          # Vendor-specific screens
│   ├── services/            # API service layer
│   ├── context/             # React context providers
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── assets/                  # Static assets
├── App.tsx                  # Root component
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
└── package.json             # Dependencies and scripts
```

## Available Scripts

```bash
npm start          # Start development server with cache cleared
npm run android    # Run on Android with cache cleared
npm run ios        # Run on iOS with cache cleared
npm run web        # Run on web with cache cleared
npm run clean      # Clean node_modules, .expo, and package-lock.json
npm run reset      # Clean and reinstall everything
```

## Key Features

### Authentication
- Email magic link authentication
- Phone number OTP verification
- Google OAuth integration
- Facebook OAuth (planned)

### User Types
- Consumer: Find and hire contractors
- Vendor: Manage services and clients

### Validations
- Email format validation with real-time feedback
- US phone number validation (XXX) XXX-XXXX format
- Required field validation on all forms
- Button states properly managed (disabled/loading)

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Proper error handling and loading states
- Consistent naming conventions

### Testing on Physical Device
1. Ensure device and computer are on same WiFi network
2. Open Expo Go app
3. Scan QR code from terminal
4. App will load with hot-reload enabled

### Testing on Emulator
- Android: Install Android Studio, create AVD, press `a`
- iOS: Install Xcode (Mac only), press `i`
- Web: Press `w` (limited functionality)

## Configuration

### Environment Variables
Create a `.env` file for API configuration:
```
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_id
```

### Package Versions
- Expo SDK: 49.0.21
- React Native: 0.72.10
- React: 18.2.0
- React Native Reanimated: 3.5.4

## Troubleshooting

### Common Issues

**App won't load:**
```bash
npm run reset
```

**Metro bundler errors:**
```bash
npx expo start -c
```

**Module not found:**
```bash
npm install
npm start
```

**Cache issues:**
```bash
npm run clean
npm install
```

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [NPM_WARNINGS_INFO.md](./NPM_WARNINGS_INFO.md) - About npm deprecation warnings
- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) - API integration guide

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Support

For technical issues or questions, please refer to the documentation or contact the development team.
