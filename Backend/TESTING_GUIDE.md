# FixRx Backend Testing Guide

## Magic Link Email Reuse for Testing

### Problem
When testing magic links, you may encounter these issues:
- "An account already exists with this email address" (for REGISTRATION)
- "No account found with this email address" (for LOGIN)
- Rate limiting preventing multiple requests

### Solution: Auto-Reset Feature

The backend now automatically handles email reuse in development mode!

## How It Works

### Automatic Reset (Recommended)
When you send a magic link request in development mode, the backend automatically:

1. **For REGISTRATION**: 
   - Deletes any existing user with that email
   - Cleans up old magic links
   - Allows fresh registration

2. **For LOGIN**:
   - Creates a test user if none exists
   - Cleans up old magic links
   - Allows immediate login testing

### Manual Reset (If Needed)
You can also manually reset a test user:

```bash
# Reset for registration testing
npm run reset-user test@example.com REGISTRATION

# Reset for login testing  
npm run reset-user test@example.com LOGIN
```

## Testing Workflow

### Quick Testing (Automatic)
1. Start the backend: `npm run dev`
2. Use any email in your mobile app
3. The backend automatically handles cleanup
4. Test registration or login seamlessly

### Manual Testing
1. Start the backend: `npm run dev`
2. Reset a specific email: `npm run reset-user your-test@email.com REGISTRATION`
3. Use that email in your mobile app
4. Test the complete flow

## Development Environment Setup

Make sure your backend `.env` file has:
```env
NODE_ENV=development
FRONTEND_URL=fixrx://
APP_SCHEME=fixrx
```

## Features

✅ **Automatic cleanup** in development mode  
✅ **No rate limiting** in development  
✅ **Reuse any email** for testing  
✅ **No manual database cleanup** needed  
✅ **Works with both LOGIN and REGISTRATION**  
✅ **Safe for development only**  

## Safety

- Auto-reset **only works in development mode**
- Production environments are **completely protected**
- No risk of accidental data loss in production

## Troubleshooting

### Still getting "user exists" errors?
- Check that `NODE_ENV=development` in your `.env` file
- Restart the backend server
- Check the backend logs for auto-reset messages

### Rate limiting issues?
- Rate limiting is disabled in development mode
- Make sure `NODE_ENV=development` is set

### Need to test with fresh data?
```bash
npm run reset-user your-email@test.com REGISTRATION
```

## Backend Logs

In development, you'll see helpful logs like:
```
🔄 Auto-resetting user for testing: test@example.com (purpose: REGISTRATION)
✅ Deleted existing magic links
✅ Deleted existing user for registration testing
✅ Auto-reset completed for test@example.com
```

This confirms the auto-reset is working properly!
