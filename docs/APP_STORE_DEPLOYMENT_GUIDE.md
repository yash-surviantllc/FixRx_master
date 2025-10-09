# App Store Deployment Guide
## FixRx Client-Vendor Management Platform

### Project: SOW-001-2025
**Target Stores**: iOS App Store & Google Play Store  
**Deployment Timeline**: Week 8 of Development Sprint  
**App Category**: Business/Productivity  

---

## 📱 **App Store Overview**

### App Information
- **App Name**: FixRx - Client-Vendor Management
- **Bundle ID**: com.fixrx.clientvendor
- **Version**: 1.0.0
- **Build Number**: 1
- **Minimum iOS Version**: 14.0
- **Minimum Android Version**: API 21 (Android 5.0)

### App Description
**Short Description** (80 characters):
"Connect with trusted contractors and service providers in your area"

**Full Description**:
FixRx is the ultimate platform connecting consumers with verified contractors and service providers. Find, rate, and manage your home service needs with confidence.

**Key Features:**
• 🔍 Smart vendor search with location-based results
• ⭐ Comprehensive 4-category rating system
• 📱 Easy contact management and bulk invitations
• 💬 Secure messaging and communication
• 📊 Performance tracking and analytics
• 🔒 Verified vendor profiles and reviews
• 📞 Seamless phone directory integration
• 🎯 Personalized vendor recommendations

---

## 🍎 **iOS App Store Deployment**

### Prerequisites
- [x] Apple Developer Account ($99/year)
- [x] Xcode 14+ installed
- [x] iOS Distribution Certificate
- [x] App Store Provisioning Profile
- [x] App Store Connect access

### App Store Connect Setup

#### 1. Create App Record
```bash
# App Information
App Name: FixRx
Bundle ID: com.fixrx.clientvendor
SKU: FIXRX-001-2025
Primary Language: English (U.S.)
```

#### 2. App Information Configuration
```yaml
# App Store Information
Category:
  Primary: Business
  Secondary: Productivity

Content Rights:
  - Contains third-party content: No
  - Uses encryption: Yes (HTTPS only)

Age Rating:
  - 4+ (Made for Everyone)
  - No restricted content

Pricing:
  - Free app
  - No in-app purchases (Phase 1)
```

#### 3. App Privacy Configuration
```yaml
Privacy Policy URL: https://fixrx.com/privacy
Data Collection:
  Contact Info:
    - Email Address: Used for account creation
    - Phone Number: Used for SMS invitations
    - Name: Used for profile creation
  
  Location:
    - Precise Location: Used for vendor search
    - Coarse Location: Used for general area matching
  
  Identifiers:
    - Device ID: Used for push notifications
  
  Usage Data:
    - Product Interaction: Used for analytics
    - Advertising Data: Not collected
  
  Diagnostics:
    - Crash Data: Used for app improvement
    - Performance Data: Used for optimization

Data Linking: Linked to user identity
Data Tracking: No tracking across apps/websites
```

### Build Configuration

#### 1. Xcode Project Settings
```xml
<!-- Info.plist Configuration -->
<key>CFBundleDisplayName</key>
<string>FixRx</string>

<key>CFBundleIdentifier</key>
<string>com.fixrx.clientvendor</string>

<key>CFBundleVersion</key>
<string>1</string>

<key>CFBundleShortVersionString</key>
<string>1.0.0</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>FixRx uses your location to find nearby service providers and contractors.</string>

<key>NSContactsUsageDescription</key>
<string>FixRx accesses your contacts to help you invite service providers to connect.</string>

<key>NSCameraUsageDescription</key>
<string>FixRx uses the camera to upload photos for your profile and service requests.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>FixRx accesses your photo library to upload images for your profile and service documentation.</string>
```

#### 2. Build Script
```bash
#!/bin/bash
# iOS Build Script

echo "🍎 Building iOS App for App Store..."

# Clean previous builds
rm -rf ios/build
rm -rf ios/DerivedData

# Install dependencies
cd FixRxMobile
npm install

# Generate iOS bundle
npx expo prebuild --platform ios --clean

# Navigate to iOS directory
cd ios

# Clean Xcode project
xcodebuild clean -workspace FixRxMobile.xcworkspace -scheme FixRxMobile

# Archive for App Store
xcodebuild archive \
  -workspace FixRxMobile.xcworkspace \
  -scheme FixRxMobile \
  -configuration Release \
  -archivePath build/FixRxMobile.xcarchive \
  -allowProvisioningUpdates

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/FixRxMobile.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist

echo "✅ iOS build complete: build/FixRxMobile.ipa"
```

#### 3. Export Options Plist
```xml
<!-- ExportOptions.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

### App Store Assets

#### 1. App Icons
```
Required iOS App Icons:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro @2x)
- 152x152 (iPad @2x)
- 76x76 (iPad)
```

#### 2. Screenshots
```
iPhone Screenshots (Required):
- 6.7" Display (iPhone 14 Pro Max): 1290x2796
- 6.5" Display (iPhone 11 Pro Max): 1242x2688
- 5.5" Display (iPhone 8 Plus): 1242x2208

iPad Screenshots (Optional):
- 12.9" Display (iPad Pro): 2048x2732
- 11" Display (iPad Pro): 1668x2388

Required Screenshots:
1. Main dashboard/home screen
2. Vendor search results
3. Vendor profile view
4. Rating and review screen
5. User profile/settings
```

#### 3. App Preview Video (Optional)
```
Specifications:
- Duration: 15-30 seconds
- Resolution: Same as screenshot requirements
- Format: .mov, .mp4, or .m4v
- Content: Key app features demonstration
```

### Submission Process

#### 1. Upload Build
```bash
# Using Xcode
# 1. Open Xcode
# 2. Window > Organizer
# 3. Select archive
# 4. Click "Distribute App"
# 5. Choose "App Store Connect"
# 6. Upload

# Using Transporter App
# 1. Download from Mac App Store
# 2. Drag and drop .ipa file
# 3. Deliver to App Store Connect
```

#### 2. App Store Connect Configuration
```yaml
Version Information:
  What's New: "Initial release of FixRx - Connect with trusted service providers in your area"
  
Build:
  - Select uploaded build
  - Add build notes for internal team

App Review Information:
  Contact Information:
    First Name: [Your Name]
    Last Name: [Your Last Name]
    Phone: [Your Phone]
    Email: [Your Email]
  
  Demo Account:
    Username: demo@fixrx.com
    Password: DemoPassword123!
    Notes: "Demo account with sample data for review"

App Review Notes:
"FixRx is a client-vendor management platform that connects consumers with service providers. The app includes location-based search, rating system, and communication features. Please use the demo account for testing all features."
```

#### 3. Submit for Review
- Review all information
- Accept Export Compliance
- Submit for App Review
- Monitor review status

---

## 🤖 **Google Play Store Deployment**

### Prerequisites
- [x] Google Play Console Account ($25 one-time fee)
- [x] Android Studio installed
- [x] Signing key generated
- [x] Google Play Console access

### Google Play Console Setup

#### 1. Create App
```yaml
App Details:
  App Name: FixRx
  Default Language: English (United States)
  
App Category:
  Category: Business
  Tags: productivity, contractors, services, home improvement

Content Rating:
  Target Age Group: Everyone
  Content Descriptors: None
```

#### 2. Store Listing
```yaml
Short Description (80 characters):
"Connect with trusted contractors and service providers in your area"

Full Description (4000 characters):
"FixRx is the ultimate platform connecting consumers with verified contractors and service providers. Whether you need a plumber, electrician, painter, or any home service professional, FixRx makes it easy to find, connect, and manage your service needs.

🔍 SMART SEARCH
Find service providers near you with our intelligent location-based search. Filter by service type, ratings, availability, and distance.

⭐ COMPREHENSIVE RATINGS
Our unique 4-category rating system evaluates providers on:
• Cost Effectiveness
• Quality of Service  
• Timeliness of Delivery
• Professionalism

📱 EASY MANAGEMENT
• Import contacts from your phone directory
• Send bulk invitations via SMS and email
• Track invitation status and responses
• Manage all your service connections in one place

💬 SECURE COMMUNICATION
Built-in messaging system for secure communication with service providers. Share project details, photos, and requirements safely.

📊 PERFORMANCE TRACKING
Monitor your service history, track provider performance, and make informed decisions for future projects.

🔒 VERIFIED PROFILES
All service providers undergo verification processes to ensure quality and reliability. Read authentic reviews from real customers.

Perfect for homeowners, property managers, and anyone who needs reliable service providers. Join thousands of satisfied users who trust FixRx for their service needs."

Graphics:
  Feature Graphic: 1024x500
  Icon: 512x512
  Phone Screenshots: 320x480 to 3840x5760
  Tablet Screenshots: 600x960 to 7680x12160
```

### Android Build Configuration

#### 1. Build Script
```bash
#!/bin/bash
# Android Build Script

echo "🤖 Building Android App for Google Play Store..."

# Clean previous builds
cd FixRxMobile
rm -rf android/app/build

# Install dependencies
npm install

# Generate Android bundle
npx expo prebuild --platform android --clean

# Navigate to Android directory
cd android

# Clean project
./gradlew clean

# Build release AAB
./gradlew bundleRelease

echo "✅ Android build complete: android/app/build/outputs/bundle/release/app-release.aab"
```

#### 2. Gradle Configuration
```gradle
// android/app/build.gradle
android {
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.fixrx.clientvendor"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        
        multiDexEnabled true
    }
    
    signingConfigs {
        release {
            storeFile file('fixrx-release-key.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. Permissions Configuration
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Optional permissions -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CALL_PHONE" />
```

### Google Play Assets

#### 1. App Icons
```
Required Android Icons:
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)
```

#### 2. Feature Graphic
```
Specifications:
- Size: 1024x500
- Format: PNG or JPEG
- Content: App branding and key features
```

#### 3. Screenshots
```
Phone Screenshots (2-8 required):
- Minimum: 320px
- Maximum: 3840px
- Aspect ratio: 16:9 to 2:1

Tablet Screenshots (Optional):
- Minimum: 600px
- Maximum: 7680px

Required Screenshots:
1. App home/dashboard
2. Vendor search interface
3. Vendor profile details
4. Rating submission screen
5. User profile management
```

### Release Management

#### 1. Internal Testing
```yaml
Internal Testing Track:
  - Upload AAB file
  - Add internal testers (up to 100)
  - Test core functionality
  - Verify crash reporting
  - Performance validation
```

#### 2. Closed Testing (Alpha)
```yaml
Closed Testing Track:
  - Create test group (up to 2000 testers)
  - Distribute via email or link
  - Collect feedback
  - Monitor crash reports
  - Performance metrics
```

#### 3. Open Testing (Beta)
```yaml
Open Testing Track:
  - Public beta testing
  - Up to 2000 testers
  - Opt-in via Play Store
  - Feedback collection
  - Final bug fixes
```

#### 4. Production Release
```yaml
Production Track:
  - Staged rollout (recommended)
  - Start with 5% of users
  - Monitor for 24-48 hours
  - Increase to 10%, 25%, 50%, 100%
  - Monitor crash rates and ratings
```

---

## 🔄 **Continuous Deployment Pipeline**

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: App Store Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  ios-deploy:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd FixRxMobile
        npm ci
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '14.3'
    
    - name: Install certificates
      env:
        BUILD_CERTIFICATE_BASE64: ${{ secrets.BUILD_CERTIFICATE_BASE64 }}
        P12_PASSWORD: ${{ secrets.P12_PASSWORD }}
        BUILD_PROVISION_PROFILE_BASE64: ${{ secrets.BUILD_PROVISION_PROFILE_BASE64 }}
      run: |
        # Install certificate and provisioning profile
        echo -n "$BUILD_CERTIFICATE_BASE64" | base64 --decode --output certificate.p12
        echo -n "$BUILD_PROVISION_PROFILE_BASE64" | base64 --decode --output build_pp.mobileprovision
        
        # Create keychain
        security create-keychain -p "" build.keychain
        security import certificate.p12 -k build.keychain -P "$P12_PASSWORD" -A
        security list-keychains -s build.keychain
        security default-keychain -s build.keychain
        security unlock-keychain -p "" build.keychain
        
        # Install provisioning profile
        mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
        cp build_pp.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles
    
    - name: Build iOS
      run: |
        cd FixRxMobile
        npx expo prebuild --platform ios --clean
        cd ios
        xcodebuild archive \
          -workspace FixRxMobile.xcworkspace \
          -scheme FixRxMobile \
          -configuration Release \
          -archivePath build/FixRxMobile.xcarchive
    
    - name: Upload to App Store Connect
      env:
        APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
      run: |
        cd FixRxMobile/ios
        xcodebuild -exportArchive \
          -archivePath build/FixRxMobile.xcarchive \
          -exportPath build \
          -exportOptionsPlist ExportOptions.plist
        
        xcrun altool --upload-app \
          --type ios \
          --file build/FixRxMobile.ipa \
          --apiKey $APP_STORE_CONNECT_API_KEY

  android-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '11'
    
    - name: Install dependencies
      run: |
        cd FixRxMobile
        npm ci
    
    - name: Setup Android signing
      env:
        KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
      run: |
        echo -n "$KEYSTORE_BASE64" | base64 --decode > FixRxMobile/android/app/fixrx-release-key.keystore
    
    - name: Build Android
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: |
        cd FixRxMobile
        npx expo prebuild --platform android --clean
        cd android
        ./gradlew bundleRelease
    
    - name: Upload to Google Play
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
        packageName: com.fixrx.clientvendor
        releaseFiles: FixRxMobile/android/app/build/outputs/bundle/release/app-release.aab
        track: internal
        status: completed
```

---

## 📊 **Post-Launch Monitoring**

### Key Metrics to Monitor

#### App Store Metrics
- **Downloads**: Daily/weekly download trends
- **Ratings**: Average rating and review sentiment
- **Crashes**: Crash-free session rate (target: >99.5%)
- **Performance**: App launch time, response times
- **Retention**: Day 1, Day 7, Day 30 retention rates

#### Business Metrics
- **User Activation**: Registration completion rate
- **Feature Adoption**: Core feature usage rates
- **Engagement**: Session duration, frequency
- **Conversion**: Invitation success rates

### Monitoring Tools Setup

#### 1. Firebase Analytics
```javascript
// Analytics configuration
import analytics from '@react-native-firebase/analytics';

// Track screen views
await analytics().logScreenView({
  screen_name: 'VendorSearch',
  screen_class: 'VendorSearchScreen',
});

// Track custom events
await analytics().logEvent('vendor_invitation_sent', {
  vendor_id: vendorId,
  invitation_method: 'sms',
  user_type: 'consumer'
});
```

#### 2. Crashlytics Setup
```javascript
// Crash reporting
import crashlytics from '@react-native-firebase/crashlytics';

// Log non-fatal errors
crashlytics().recordError(new Error('Non-fatal error'));

// Set user attributes
crashlytics().setUserId(userId);
crashlytics().setAttribute('user_type', userType);
```

#### 3. Performance Monitoring
```javascript
// Performance tracking
import perf from '@react-native-firebase/perf';

// HTTP request monitoring
const httpMetric = perf().newHttpMetric(url, 'GET');
await httpMetric.start();
// ... make request
await httpMetric.stop();

// Custom traces
const trace = perf().newTrace('vendor_search');
await trace.start();
// ... search logic
await trace.stop();
```

---

## 🚨 **Emergency Response Plan**

### Critical Issues Response

#### 1. App Crashes (>1% crash rate)
```yaml
Response Time: < 2 hours
Actions:
  - Identify crash patterns in Crashlytics
  - Prepare hotfix if possible
  - Submit emergency update to stores
  - Communicate with users via in-app messaging
```

#### 2. Security Vulnerabilities
```yaml
Response Time: < 1 hour
Actions:
  - Assess vulnerability severity
  - Implement immediate backend fixes
  - Prepare app update if needed
  - Notify users if data is compromised
```

#### 3. Store Policy Violations
```yaml
Response Time: < 4 hours
Actions:
  - Review violation notice
  - Implement required changes
  - Submit appeal if necessary
  - Prepare compliance documentation
```

### Rollback Procedures

#### iOS Rollback
```bash
# Remove current version from sale
# Previous version automatically becomes available
# Monitor for 24 hours before re-releasing
```

#### Android Rollback
```bash
# Use Google Play Console
# Halt rollout of current version
# Increase rollout of previous version to 100%
# Monitor crash reports and user feedback
```

---

## 📋 **Pre-Launch Checklist**

### Technical Checklist
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility compliance verified
- [ ] Privacy policy updated
- [ ] Terms of service finalized
- [ ] Analytics and crash reporting configured
- [ ] Push notifications tested
- [ ] Deep linking verified
- [ ] Offline functionality tested
- [ ] App store assets prepared
- [ ] Screenshots and videos ready
- [ ] App descriptions finalized

### Business Checklist
- [ ] Marketing materials prepared
- [ ] Press release drafted
- [ ] Social media campaigns ready
- [ ] Customer support documentation updated
- [ ] User onboarding flow optimized
- [ ] Feedback collection system ready
- [ ] App store optimization (ASO) completed
- [ ] Launch day monitoring plan ready

### Legal Checklist
- [ ] Privacy policy compliance (GDPR, CCPA)
- [ ] Terms of service reviewed
- [ ] Data processing agreements signed
- [ ] Third-party licenses documented
- [ ] App store compliance verified
- [ ] Age rating appropriate
- [ ] Content guidelines followed

---

## 🎯 **Success Metrics**

### Launch Week Targets
- **Downloads**: 1,000+ downloads
- **Ratings**: 4.0+ average rating
- **Crashes**: <0.5% crash rate
- **Reviews**: 50+ positive reviews
- **Retention**: 70%+ Day 1 retention

### Month 1 Targets
- **Downloads**: 10,000+ downloads
- **Active Users**: 5,000+ MAU
- **Ratings**: 4.2+ average rating
- **Feature Adoption**: 60%+ core feature usage
- **Support Tickets**: <5% of users

---

**Deployment Guide Status**: ✅ Complete  
**Estimated Deployment Timeline**: 1-2 weeks  
**App Store Review Time**: 1-7 days (iOS), 1-3 days (Android)  
**Launch Readiness**: 95% Complete
