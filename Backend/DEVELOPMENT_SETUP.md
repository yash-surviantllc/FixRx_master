# FixRx Development Setup Guide

## Quick Start for Magic Link Testing

### 1. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
npm run dev
```

### 2. Mobile App Setup
```bash
cd FixRxMobile
npm install
npm start
```

## Magic Link Development Testing

Since SendGrid email service is not configured by default, the magic links will be displayed in the **backend console** for development testing.

### How to Test Magic Links:

1. **Start the backend server** (`npm run dev`)
2. **Enter any email** in the mobile app
3. **Check the backend console** - you'll see output like this:

```
🔗 DEVELOPMENT MAGIC LINK (Email service not configured):
📧 Email: test@example.com
🌐 Web Link: http://192.168.0.230:3000/magic-link?token=abc123...&email=test@example.com
📱 Deep Link: fixrx://magic-link?token=abc123...&email=test@example.com
⏰ Expires: 2024-10-16T12:30:00.000Z
🔑 Token: abc123def4...

💡 Copy the Deep Link above and paste it in your browser or use it directly in the app
```

4. **Copy the Deep Link** (the `fixrx://` URL)
5. **Paste it in your browser** or **open it directly** - it will redirect to the mobile app
6. **Magic link verification will complete** automatically

### Email Configuration (Optional)

To enable actual email sending, add your SendGrid API key to `.env`:

```bash
# Get your API key from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

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
