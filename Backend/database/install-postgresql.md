# PostgreSQL Installation Guide for FixRx Backend

## Windows Installation

### Option 1: PostgreSQL Official Installer (Recommended)

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 14 or later
   - Choose the installer for Windows x86-64

2. **Run the Installer**
   - Run the downloaded `.exe` file as Administrator
   - Follow the installation wizard:
     - Installation Directory: `C:\Program Files\PostgreSQL\14`
     - Data Directory: `C:\Program Files\PostgreSQL\14\data`
     - Password: Set a strong password for `postgres` user
     - Port: `5432` (default)
     - Locale: Default locale

3. **Components to Install**
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Stack Builder (for additional tools)
   - ✅ Command Line Tools

### Option 2: Using Chocolatey

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql14 -y

# Install pgAdmin (optional GUI)
choco install pgadmin4 -y
```

### Option 3: Using Docker (Alternative)

```powershell
# Install Docker Desktop first, then run:
docker run --name fixrx-postgres -e POSTGRES_PASSWORD=fixrx123 -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5432:5432 -d postgres:14

# Create the FixRx database
docker exec -it fixrx-postgres psql -U postgres -c "CREATE DATABASE fixrx_production;"
```

## Post-Installation Setup

### 1. Verify Installation

```powershell
# Check if PostgreSQL is running
psql --version

# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432
```

### 2. Create FixRx Database and User

```sql
-- Connect as postgres user
psql -U postgres -h localhost

-- Create database
CREATE DATABASE fixrx_production;

-- Create user
CREATE USER fixrx_user WITH PASSWORD 'fixrx123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;

-- Exit
\q
```

### 3. Run Database Setup Scripts

```powershell
# Navigate to the database directory
cd "C:\Users\Yash Raj Jaiswal\Desktop\FixRx\Backend\database"

# Run the setup script
psql -U postgres -h localhost -d fixrx_production -f setup-database.sql

# Run the seed data script
psql -U postgres -h localhost -d fixrx_production -f seed-data.sql
```

## Configuration for FixRx Backend

### Update Backend .env file

Your `.env` file should have these database settings:

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

### Test Database Connection

Create a test file to verify connection:

```javascript
// test-db-connection.js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fixrx_production',
  user: 'fixrx_user',
  password: 'fixrx123',
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
```

## Troubleshooting

### Common Issues

1. **Port 5432 already in use**
   ```powershell
   # Check what's using port 5432
   netstat -an | findstr :5432
   
   # Stop PostgreSQL service
   net stop postgresql-x64-14
   
   # Start PostgreSQL service
   net start postgresql-x64-14
   ```

2. **Authentication failed**
   - Check password in `.env` file
   - Verify user exists: `psql -U postgres -c "\du"`
   - Reset password: `ALTER USER fixrx_user PASSWORD 'fixrx123';`

3. **Database does not exist**
   ```sql
   -- Connect as postgres and create database
   psql -U postgres
   CREATE DATABASE fixrx_production;
   GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
   ```

4. **Permission denied**
   ```sql
   -- Grant all permissions
   GRANT ALL PRIVILEGES ON DATABASE fixrx_production TO fixrx_user;
   \c fixrx_production
   GRANT ALL ON SCHEMA public TO fixrx_user;
   ```

### PostgreSQL Service Management

```powershell
# Check service status
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-14

# Stop service
Stop-Service postgresql-x64-14

# Restart service
Restart-Service postgresql-x64-14
```

## GUI Tools

### pgAdmin 4 (Recommended)
- Web-based PostgreSQL administration tool
- Access: http://localhost:5432/pgadmin4
- Create server connection with your credentials

### Alternative Tools
- **DBeaver**: Universal database tool
- **DataGrip**: JetBrains database IDE
- **TablePlus**: Modern database management tool

## Security Notes

### For Production
- Change default passwords
- Use SSL connections
- Configure `pg_hba.conf` for proper authentication
- Set up regular backups
- Monitor database performance

### For Development
- Current setup is suitable for development
- Keep default settings for local development
- Ensure firewall allows PostgreSQL connections

## Next Steps

After PostgreSQL is installed and configured:

1. ✅ Install PostgreSQL
2. ✅ Create database and user
3. ✅ Run setup scripts
4. ✅ Update `.env` configuration
5. ✅ Test database connection
6. 🚀 Start your FixRx backend server

```powershell
# Start the backend server
cd "C:\Users\Yash Raj Jaiswal\Desktop\FixRx\Backend"
npm run dev
```
