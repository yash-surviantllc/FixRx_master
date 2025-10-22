# FixRx Database Quick Setup

## 🚀 One-Click Setup (Recommended)

### Option 1: PowerShell Script
```powershell
# Right-click and "Run with PowerShell"
.\setup-database.ps1
```

### Option 2: Batch Script
```cmd
# Double-click to run
setup-database.bat
```

### Option 3: Node.js Script
```powershell
node setup-database-complete.js
```

---

## 📋 Manual Setup (If scripts fail)

### 1. Install PostgreSQL
```powershell
# Using Chocolatey (Run as Administrator)
choco install postgresql14 -y

# Or download from: https://www.postgresql.org/download/windows/
```

### 2. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost

-- Create database and user
CREATE DATABASE fixrx_production;
CREATE USER fixrx_user WITH PASSWORD 'fixrx123';
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
```

### 3. Create Tables
```powershell
node database\create-tables.js
```

### 4. Test Connection
```powershell
node database\test-connection.js
```

---

## ✅ Verification Steps

After setup, you should see:

### 1. Database Connection Test
```
🔍 Testing Database Connection...
✅ Database connection successful!
✅ PostgreSQL version: PostgreSQL 14.19
✅ Found 8 tables
✅ User has sufficient permissions
🎉 All database tests passed successfully!
```

### 2. Backend Server Start
```powershell
npm run dev
```
Should show:
```
🚀 FixRx Application Server Started
📡 Port: 3000
🗄️ Database: Connected
🎯 Ready for Production Traffic!
```

### 3. API Test
```powershell
node test-mobile-endpoints.js
```
Should show:
```
✅ Get Service Categories: PASSED (7 categories)
✅ Get Services by Category: PASSED
🚀 Status: Your backend now supports ALL mobile app requirements!
```

---

## 🔧 Troubleshooting

### PostgreSQL Not Found
```powershell
# Install PostgreSQL
choco install postgresql14 -y

# Or check if service is running
Get-Service postgresql*
Start-Service postgresql-x64-14
```

### Connection Failed
```sql
-- Reset user password
psql -U postgres
ALTER USER fixrx_user PASSWORD 'fixrx123';
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
```

### Tables Not Created
```powershell
# Run table creation again
node database\create-tables.js
```

---

## 📊 Database Schema

**8 Core Tables Created:**
- `users` - User accounts (consumers/vendors)
- `service_categories` - Service categories (7 categories)
- `services` - Specific services within categories
- `vendor_services` - Services offered by vendors
- `connection_requests` - Consumer-vendor connections
- `messages` - User messaging
- `ratings` - User ratings/reviews
- `notifications` - User notifications

**Sample Data Included:**
- 7 Service Categories (Plumbing, Electrical, etc.)
- 5 Sample Users (2 consumers, 3 vendors)

---

## 🎯 Connection Details

After successful setup:

**Database:**
- Host: `localhost`
- Port: `5432`
- Database: `fixrx_production`
- User: `fixrx_user`
- Password: `fixrx123`

**Backend API:**
- URL: `http://localhost:3000`
- Health: `http://localhost:3000/health`
- API Base: `http://localhost:3000/api/v1`

---

## 🚀 Next Steps

1. **✅ Database Setup Complete**
2. **Start Backend:** `npm run dev`
3. **Test APIs:** `node test-mobile-endpoints.js`
4. **Connect React Native App:** Point to `http://localhost:3000`

Your FixRx database is now ready for production use! 🎉
