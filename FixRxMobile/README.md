# FixRx Mobile App

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo Go app on your phone (for testing)
- Android Studio (for Android development) or Xcode (for iOS development on Mac)

### Running the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Run on your device:**
   - Install **Expo Go** from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in terminal with:
     - iOS: Camera app
     - Android: Expo Go app

3. **Run on simulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (Mac only)
   - Press `w` for web browser

## 📱 Testing Your App

### On Physical Device
1. Make sure your phone and computer are on the same WiFi network
2. Open Expo Go app
3. Scan the QR code from terminal
4. App will load and hot-reload on changes

### On Emulator/Simulator
- **Android:** Install Android Studio, create an AVD, then press `a` in terminal
- **iOS (Mac only):** Install Xcode, then press `i` in terminal
- **Web:** Press `w` to open in browser (limited functionality)

## 🏗️ Project Structure

```
FixRxMobile/
├── App.tsx                    # Main app entry point
├── src/
│   ├── components/
│   │   └── native/           # React Native components
│   │       └── Form.tsx      # Form components
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Navigation setup
│   ├── screens/              # App screens
│   │   └── EmailAuthScreen.native.tsx
│   └── utils/
│       └── styleConverter.ts # Style utilities
├── assets/                   # Images, fonts, etc.
└── package.json             # Dependencies
```

## 🔧 Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Run on web
npm run web

# Install new dependencies
npm install <package-name>
```

## 📝 Development Tips

1. **Hot Reload:** Save files to see changes instantly
2. **Shake device:** Opens developer menu on device
3. **Press `r` in terminal:** Reload the app
4. **Press `j` in terminal:** Open debugger

## 🎨 Styling

We use a custom style converter that transforms Tailwind-like classes to React Native styles:

```typescript
import { tw } from './src/utils/styleConverter';

// Use Tailwind-like classes
<View style={tw('flex-1 p-4 bg-white')}>
  <Text style={tw('text-lg font-bold text-gray-900')}>
    Hello World
  </Text>
</View>
```

## 🚦 Next Steps

1. **Test the app** on your device using Expo Go
2. **Migrate more screens** from the web version
3. **Add native features** like push notifications
4. **Build for production** using EAS Build

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

## 🐛 Troubleshooting

### App won't load
- Ensure phone and computer are on same network
- Try restarting the Metro bundler: `npm start -- --clear`
- Check firewall settings

### Module not found errors
- Run `npm install`
- Clear cache: `npm start -- --clear`

### Styling issues
- Remember React Native doesn't support all CSS properties
- Use the styleConverter utility for Tailwind classes
- Check Platform-specific code for iOS/Android differences
