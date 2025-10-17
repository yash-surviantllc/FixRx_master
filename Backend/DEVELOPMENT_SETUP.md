# FixRx Development Setup Guide

## Quick Start - Automated Setup

### 1. Run Setup Script (Windows)
```bash
setup-env.bat
```

### 2. Start Backend
```bash
cd Backend
npm install
npm run dev
```

### 3. Start Mobile App
```bash
cd FixRxMobile
npm install
npm start
```

## Magic Link Testing - Fully Automated

### How Magic Links Work:

1. **Enter any email** in the mobile app (e.g., your Gmail)
2. **Magic link is sent to your email** automatically via SendGrid
3. **Check your email** and click the magic link
4. **App opens automatically** and completes verification
5. **Navigate to UserType screen** - fully automated flow

### Email Configuration

SendGrid is **pre-configured** with working API key:
- ✅ **API Key**: Already set in .env.example
- ✅ **From Email**: yash@surviant.in
- ✅ **Email Templates**: Professional HTML emails
- ✅ **Automatic Sending**: No manual intervention needed

## Features Working in Development:

✅ **Magic Link Generation** - Creates secure tokens and URLs  
✅ **Console Link Display** - Shows links in backend console for easy testing  
✅ **Deep Link Handling** - Custom `fixrx://` scheme works perfectly  
✅ **Auto User Reset** - Automatically handles existing users in development  
✅ **Token Verification** - Full verification flow works end-to-end  
✅ **Navigation Flow** - Seamless transition to UserType screen  

## Troubleshooting:

**Q: I don't see the magic link in the console**  
A: Make sure the backend is running and check the terminal where you ran `npm run dev`

**Q: The deep link doesn't work**  
A: Make sure you're copying the `fixrx://` URL (not the web URL) and that the mobile app is running

**Q: "Token already used" error**  
A: This is normal - tokens can only be used once. Just request a new magic link

**Q: App crashes or shows errors**  
A: Check that both backend and mobile app are running, and that you're using the correct IP addresses in the configuration
