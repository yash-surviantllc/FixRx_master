# FixRx Database Setup Guide
## Step-by-Step PostgreSQL Setup for FixRx Backend

### 📋 Prerequisites
- Windows 10/11
- Administrator access
- Internet connection

---

## 🚀 Step 1: Install PostgreSQL

### Option A: Using Chocolatey (Recommended)
1. **Open PowerShell as Administrator**
   ```powershell
   # Right-click Start Menu → Windows PowerShell (Admin)
   ```

2. **Install Chocolatey (if not already installed)**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

3. **Install PostgreSQL**
   ```powershell
   choco install postgresql14 -y
   ```

4. **Verify Installation**
   ```powershell
   # Check if service is running
   Get-Service postgresql*
   ```

### Option B: Official Installer
1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 14.x installer
   - Run as Administrator

2. **Installation Settings**
   - Installation Directory: `C:\Program Files\PostgreSQL\14`
   - Data Directory: `C:\Program Files\PostgreSQL\14\data`
   - **Set Password**: `postgres` (remember this!)
   - Port: `5432`
   - Locale: Default

3. **Components to Install**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools

---

## 🔧 Step 2: Configure PostgreSQL

### 1. Add PostgreSQL to PATH
```powershell
# Add PostgreSQL bin directory to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\14\bin"

# Verify psql is available
psql --version
```

### 2. Test PostgreSQL Connection
```powershell
# Connect to PostgreSQL as postgres user
psql -U postgres -h localhost

# You should see:
# Password for user postgres: [enter: postgres]
# postgres=#
```

---

## 🗄️ Step 3: Create FixRx Database

### 1. Connect to PostgreSQL
```powershell
# Open Command Prompt or PowerShell
psql -U postgres -h localhost
```

### 2. Create Database and User
```sql
-- Create the FixRx database
CREATE DATABASE fixrx_production;

-- Create the FixRx user
CREATE USER fixrx_user WITH PASSWORD 'fixrx123';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;

-- Connect to the new database
\c fixrx_production;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fixrx_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fixrx_user;

-- Exit PostgreSQL
\q
```

---

## 📊 Step 4: Create Database Schema

### 1. Navigate to Backend Directory
```powershell
cd "C:\Users\Yash Raj Jaiswal\Desktop\FixRx\Backend"
```

### 2. Run Database Setup Script
```powershell
# Method 1: Using Node.js script (Recommended)
node database\create-tables.js
```

**Expected Output:**
```
🏗️ Creating FixRx Database Tables...
✅ Connected to database
✅ UUID extension enabled
✅ Users table created
✅ Service categories table created
✅ Services table created
✅ Vendor services table created
✅ Connection requests table created
✅ Messages table created
✅ Ratings table created
✅ Notifications table created
✅ Indexes created
✅ Sample service categories inserted
✅ Sample users inserted

🎉 Database tables created successfully!
```

### 3. Alternative: Manual SQL Execution
```powershell
# If Node.js method fails, use direct SQL
psql -U postgres -h localhost -d fixrx_production -f database\setup-database.sql
```

---

## ✅ Step 5: Verify Database Setup

### 1. Test Database Connection
```powershell
node database\test-connection.js
```

**Expected Output:**
```
🔍 Testing Database Connection...
✅ Database connection successful!
✅ Current database time: 2025-10-05T14:03:56.123Z
✅ PostgreSQL version: PostgreSQL 14.19
✅ Found 8 tables:
   - connection_requests
   - messages
   - notifications
   - ratings
   - service_categories
   - services
   - users
   - vendor_services
✅ User has sufficient permissions
🎉 All database tests passed successfully!
```

### 2. Verify Sample Data
```powershell
# Connect to database
psql -U fixrx_user -h localhost -d fixrx_production

# Check tables and data
\dt

# Check users
SELECT COUNT(*), user_type FROM users GROUP BY user_type;

# Check service categories
SELECT name FROM service_categories ORDER BY sort_order;

# Exit
\q
```

---

## ⚙️ Step 6: Configure Backend Environment

### 1. Update .env File
```powershell
# Edit the .env file in Backend directory
notepad .env
```

**Ensure these settings in .env:**
```env
# Database Configuration
DATABASE_URL=postgresql://fixrx_user:fixrx123@localhost:5432/fixrx_production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixrx_production
DB_USER=fixrx_user
DB_PASSWORD=fixrx123
DB_SSL=false
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### 2. Test Backend Connection
```powershell
# Start the backend server
npm run dev
```

**Expected Output:**
```
🚀 FixRx Application Server Started
===========================================
🎯 Architecture: development
📡 Port: 3000
🗄️ Database: Connected
🔄 Queue: Active
🔐 Auth0: Connected
🗺️ GeoSearch: Active
📊 Monitoring: Active
===========================================
🎯 Ready for Production Traffic!
```

---

## 🧪 Step 7: Test Complete Setup

### 1. Run Comprehensive Tests
```powershell
# Test all APIs and database
node test-mobile-endpoints.js
```

### 2. Test Health Endpoint
```powershell
# In another terminal/PowerShell window
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-05T14:03:56.123Z",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

---

## 🔧 Troubleshooting

### Issue 1: PostgreSQL Service Not Running
```powershell
# Check service status
Get-Service postgresql*

# Start service if stopped
Start-Service postgresql-x64-14

# Or restart service
Restart-Service postgresql-x64-14
```

### Issue 2: Connection Refused
```powershell
# Check if PostgreSQL is listening on port 5432
netstat -an | findstr :5432

# If not running, start PostgreSQL service
net start postgresql-x64-14
```

### Issue 3: Authentication Failed
```sql
-- Connect as postgres user and reset password
psql -U postgres
ALTER USER fixrx_user PASSWORD 'fixrx123';
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
```

### Issue 4: Tables Not Created
```powershell
# Run table creation script again
node database\create-tables.js

# Or manually create tables
psql -U postgres -d fixrx_production -f database\setup-database.sql
```

### Issue 5: Permission Denied
```sql
-- Connect as postgres and grant permissions
psql -U postgres -d fixrx_production
GRANT ALL ON SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fixrx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fixrx_user;
```

---

## 📊 Database Schema Overview

### Core Tables Created:
1. **users** - User accounts (consumers and vendors)
2. **service_categories** - Service categories (Plumbing, Electrical, etc.)
3. **services** - Specific services within categories
4. **vendor_services** - Services offered by vendors
5. **connection_requests** - Consumer-vendor connections
6. **messages** - User-to-user messaging
7. **ratings** - User ratings and reviews
8. **notifications** - User notifications

### Sample Data Included:
- **7 Service Categories**: Plumbing, Electrical, HVAC, Carpentry, Painting, Cleaning, Handyman
- **5 Sample Users**: 2 consumers, 3 vendors
- **Service Relationships**: Vendors linked to their specialties

---

## ✅ Final Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `fixrx_production` created
- [ ] User `fixrx_user` created with correct permissions
- [ ] All 8 tables created successfully
- [ ] Sample data inserted
- [ ] Backend connects to database
- [ ] API endpoints responding
- [ ] Health check passes

---

## 🎯 Next Steps

After successful database setup:

1. **✅ Database**: Ready and populated
2. **✅ Backend**: Connected and running
3. **✅ APIs**: All endpoints operational
4. **🚀 Ready**: For React Native frontend integration

**Your FixRx database is now fully configured and ready for production use!**

**Connection Details:**
- **Host**: localhost
- **Port**: 5432
- **Database**: fixrx_production
- **User**: fixrx_user
- **Password**: fixrx123
- **Backend URL**: http://localhost:3000
