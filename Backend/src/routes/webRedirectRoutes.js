/**
 * Web Redirect Routes for Magic Links
 * Handles browser fallback for magic link authentication
 */

const express = require('express');
const router = express.Router();

// Magic link web redirect handler
router.get('/', (req, res) => {
  const { token, email } = req.query;
  
  if (!token || !email) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FixRx - Invalid Link</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
          .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>FixRx</h1>
          <p class="error">Invalid or expired magic link</p>
          <p>Please request a new magic link from the app.</p>
        </div>
      </body>
      </html>
    `);
  }

  const appDeepLink = `fixrx://magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  
  // For Expo Go development, use exp:// scheme
  const expoDeepLink = process.env.NODE_ENV === 'development' 
    ? `exp://${req.get('host').split(':')[0]}:8081/--/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    : null;
  
  // Use Expo link as primary in development
  const primaryLink = expoDeepLink || appDeepLink;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FixRx - Opening App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: #f8fafc; 
          margin: 0;
        }
        .container { 
          max-width: 400px; 
          margin: 0 auto; 
          background: white; 
          padding: 30px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .logo { 
          color: #2563eb; 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 20px; 
        }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 10px; 
          font-weight: 500;
        }
        .button:hover { background: #1d4ed8; }
        .secondary { background: #6b7280; }
        .secondary:hover { background: #4b5563; }
        .spinner { 
          border: 3px solid #f3f3f3; 
          border-top: 3px solid #2563eb; 
          border-radius: 50%; 
          width: 30px; 
          height: 30px; 
          animation: spin 1s linear infinite; 
          margin: 20px auto; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .instructions { color: #6b7280; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">FixRx</div>
        <h2>Almost There!</h2>
        <p style="color: #475569; font-size: 16px; margin: 20px 0;">
          ${expoDeepLink ? 'Click the button below to open the app in Expo Go:' : 'Click the button below to open the FixRx app:'}
        </p>
        
        <a href="${primaryLink}" class="button" id="primaryLink" style="font-size: 18px; padding: 16px 32px;">
          ${expoDeepLink ? '📱 Open in Expo Go' : '📱 Open FixRx App'}
        </a>
        
        <div style="margin-top: 20px;">
          <p style="color: #6b7280; font-size: 14px;">
            ${expoDeepLink ? 'Make sure Expo Go is running on your device' : 'Make sure the FixRx app is installed'}
          </p>
        </div>
        
        <div class="instructions">
          <p><strong>Don't have the app?</strong></p>
          <p>Download FixRx from the App Store or Google Play, then click the link again.</p>
        </div>
      </div>

      <script>
        function attemptDeepLink(url) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            try {
              window.location.href = url;
            } catch (e) {
              console.log('Direct navigation failed:', e);
            }
          }, 100);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        }
        
        // Don't auto-redirect in development (Expo Go) - it triggers permission dialogs
        // User must manually click the button
        ${expoDeepLink ? '// Development mode - manual click required' : `
        setTimeout(() => {
          attemptDeepLink('${primaryLink}');
        }, 500);
        `}
        
        document.addEventListener('DOMContentLoaded', function() {
          const primaryLink = document.getElementById('primaryLink');
          if (primaryLink) {
            primaryLink.addEventListener('click', function(e) {
              e.preventDefault();
              attemptDeepLink(this.href);
            });
          }
          
          const deepLinkButtons = document.querySelectorAll('a[href^="fixrx://"], a[href^="exp://"]');
          deepLinkButtons.forEach(button => {
            button.addEventListener('click', function(e) {
              e.preventDefault();
              attemptDeepLink(this.href);
            });
          });
        });
        
        let appOpened = false;
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) {
            appOpened = true;
          }
        });
        
        setTimeout(() => {
          if (!appOpened) {
            const fallbackDiv = document.getElementById('fallback');
            if (fallbackDiv && fallbackDiv.style.display === 'none') {
              fallbackDiv.style.display = 'block';
            }
          }
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
