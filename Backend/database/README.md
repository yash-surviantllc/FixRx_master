# FixRx Database Setup

This directory contains all the necessary files to set up the PostgreSQL database for the FixRx backend.

## 📁 Files Overview

- **`setup-database.sql`** - Complete database schema with tables, indexes, and triggers
- **`seed-data.sql`** - Initial sample data for development and testing
- **`test-connection.js`** - Database connection test script
- **`install-postgresql.md`** - PostgreSQL installation guide for Windows

## 🚀 Quick Setup

### 1. Install PostgreSQL
Follow the instructions in `install-postgresql.md` to install PostgreSQL on Windows.

### 2. Create Database and User
```sql
-- Connect as postgres user
psql -U postgres -h localhost

-- Create database and user
CREATE DATABASE fixrx_production;
CREATE USER fixrx_user WITH PASSWORD 'fixrx123';
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
\q
```

### 3. Run Setup Scripts
```powershell
# Navigate to database directory
cd "C:\Users\Yash Raj Jaiswal\Desktop\FixRx\Backend\database"

# Create tables and schema
psql -U postgres -h localhost -d fixrx_production -f setup-database.sql

# Insert sample data
psql -U postgres -h localhost -d fixrx_production -f seed-data.sql
```

### 4. Test Connection
```powershell
# Test database connection
node test-connection.js
```

## 📊 Database Schema

### Core Tables

1. **users** - User accounts (consumers and vendors)
2. **user_profiles** - Extended user information
3. **service_categories** - Service categories (Plumbing, Electrical, etc.)
4. **services** - Specific services within categories
5. **vendor_services** - Services offered by vendors
6. **vendor_portfolio** - Vendor portfolio items
7. **connection_requests** - Consumer-vendor connection requests
8. **messages** - Messages between users
9. **ratings** - User ratings and reviews
10. **invitations** - User invitations
11. **notifications** - User notifications
12. **user_sessions** - User session tracking
13. **analytics_events** - Analytics and tracking data

### Key Features

- **UUID Primary Keys** - All tables use UUID for better scalability
- **Timestamps** - Automatic created_at and updated_at timestamps
- **Indexes** - Optimized indexes for performance
- **Constraints** - Data integrity constraints
- **Triggers** - Automatic timestamp updates

## 🔧 Configuration

Update your `.env` file with these database settings:

```env
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

## 📈 Sample Data

The seed data includes:

- **10 Service Categories** (Plumbing, Electrical, HVAC, etc.)
- **50+ Services** across all categories
- **8 Sample Users** (3 consumers, 5 vendors)
- **Vendor Services** - Links between vendors and their services
- **Portfolio Items** - Sample work portfolios for vendors

## 🧪 Testing

Run the connection test to verify everything is working:

```powershell
node test-connection.js
```

Expected output:
```
✅ Database connection successful!
✅ Current database time: 2024-10-05T19:10:22.123Z
✅ PostgreSQL version: PostgreSQL 14.x
✅ Found 13 tables
✅ User has sufficient permissions
✅ Connection pool status: {...}
🎉 All database tests passed successfully!
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection refused**
   - PostgreSQL service not running
   - Wrong host/port configuration

2. **Authentication failed**
   - Incorrect username/password
   - User doesn't exist

3. **Database doesn't exist**
   - Run database creation commands
   - Check database name in configuration

4. **Permission denied**
   - User lacks necessary privileges
   - Run GRANT commands

### Solutions

Check the `install-postgresql.md` file for detailed troubleshooting steps.

## 🚀 Next Steps

After successful database setup:

1. ✅ Database installed and configured
2. ✅ Tables created with sample data
3. ✅ Connection tested successfully
4. 🚀 Start the backend server: `npm run dev`

Your FixRx database is now ready for development!
