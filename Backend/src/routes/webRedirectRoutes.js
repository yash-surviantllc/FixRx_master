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

  // Create the deep link URL for the app
  const appDeepLink = `exp://192.168.1.5:8082/--/magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const fallbackDeepLink = `fixrx://magic-link?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

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
        <h2>Opening FixRx App...</h2>
        <div class="spinner"></div>
        <p>If the app doesn't open automatically, click below:</p>
        
        <a href="${appDeepLink}" class="button" onclick="setTimeout(() => { document.getElementById('fallback').style.display = 'block'; }, 3000);">
          Open FixRx App
        </a>
        
        <div id="fallback" style="display: none; margin-top: 20px;">
          <p>App not opening? Try this alternative:</p>
          <a href="${fallbackDeepLink}" class="button secondary">
            Try Alternative Link
          </a>
        </div>
        
        <div class="instructions">
          <p><strong>Don't have the app?</strong></p>
          <p>Download FixRx from the App Store or Google Play, then click the link again.</p>
        </div>
      </div>

      <script>
        // Automatically try to open the app
        setTimeout(() => {
          try {
            window.location.href = '${appDeepLink}';
          } catch (e) {
            console.log('Failed to open app automatically');
          }
        }, 1000);
        
        // Show fallback options after 2 seconds
        setTimeout(() => {
          document.getElementById('fallback').style.display = 'block';
        }, 2000);
        
        // Add click handlers for manual attempts
        document.addEventListener('DOMContentLoaded', function() {
          const buttons = document.querySelectorAll('a[href*="exp://"]');
          buttons.forEach(button => {
            button.addEventListener('click', function(e) {
              e.preventDefault();
              try {
                window.location.href = this.href;
              } catch (error) {
                alert('Unable to open app. Please make sure Expo Go is installed.');
              }
            });
          });
        });
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
