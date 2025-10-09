# FixRx Database Setup Script (PowerShell)
# Run this script to automatically set up your database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FixRx Database Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is available: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        throw "npm install failed"
    }
} catch {
    Write-Host "❌ ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 3: Run complete database setup
Write-Host "Step 3: Running complete database setup..." -ForegroundColor Yellow
try {
    node setup-database-complete.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup completed successfully" -ForegroundColor Green
    } else {
        throw "Database setup failed"
    }
} catch {
    Write-Host "❌ ERROR: Database setup failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Test database connection
Write-Host "Step 4: Testing database connection..." -ForegroundColor Yellow
try {
    node database\test-connection.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection test passed" -ForegroundColor Green
    } else {
        throw "Database connection test failed"
    }
} catch {
    Write-Host "❌ ERROR: Database connection test failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your FixRx database is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start backend: npm run dev" -ForegroundColor White
Write-Host "2. Test APIs: node test-mobile-endpoints.js" -ForegroundColor White
Write-Host "3. Connect React Native app to: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Database Connection Details:" -ForegroundColor Cyan
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White
Write-Host "Database: fixrx_production" -ForegroundColor White
Write-Host "User: fixrx_user" -ForegroundColor White
Write-Host "Password: fixrx123" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
