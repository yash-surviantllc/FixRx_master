@echo off
echo ========================================
echo FixRx Database Setup Script
echo ========================================
echo.

echo Step 1: Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is available

echo.
echo Step 2: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Step 3: Running complete database setup...
node setup-database-complete.js
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo Step 4: Testing database connection...
node database\test-connection.js
if %errorlevel% neq 0 (
    echo ERROR: Database connection test failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DATABASE SETUP COMPLETE!
echo ========================================
echo.
echo Your FixRx database is now ready!
echo.
echo Next steps:
echo 1. Start backend: npm run dev
echo 2. Test APIs: node test-mobile-endpoints.js
echo 3. Connect React Native app to: http://localhost:3000
echo.
pause
