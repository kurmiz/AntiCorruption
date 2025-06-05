# MongoDB Database Setup Guide

## Overview

This guide provides comprehensive instructions for setting up MongoDB for the Anti-Corruption Portal backend system.

## MongoDB Version Requirements

- **MongoDB Version**: 7.0+ (recommended)
- **Mongoose Version**: 8.0+
- **Node.js Version**: 18.0+

## Installation Options

### Option 1: Local MongoDB Installation

#### Windows
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Configure network access (add your IP)
4. Create database user
5. Get connection string

### Option 3: Docker

```bash
# Pull MongoDB image
docker pull mongo:7.0

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7.0

# For development without authentication
docker run -d \
  --name mongodb-dev \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0
```

## Environment Configuration

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Configure MongoDB Connection

#### Local MongoDB (No Authentication)
```env
MONGODB_URI=mongodb://localhost:27017/anticorruption
```

#### Local MongoDB (With Authentication)
```env
MONGODB_URI=mongodb://username:password@localhost:27017/anticorruption
MONGODB_AUTH_SOURCE=admin
```

#### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/anticorruption
```

#### Advanced Configuration
```env
# Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME_MS=30000

# Timeout Settings
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000
MONGODB_CONNECT_TIMEOUT_MS=10000

# Security Settings (Production)
MONGODB_SSL_ENABLED=true
MONGODB_SSL_VALIDATE=true
```

## Database Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Setup Script
```bash
# Run the MongoDB setup script
node scripts/setup-mongodb.js
```

This script will:
- Create database and collections
- Set up validation rules
- Create performance indexes
- Seed initial admin and police users

### 3. Verify Setup
```bash
# Start the backend server
npm run dev

# Check health endpoint
curl http://localhost:5000/health

# Check database status
curl http://localhost:5000/api/status/database
```

## Database Schema

### Collections

#### Users Collection
- **Purpose**: Store user accounts and authentication data
- **Validation**: Email format, password strength, role validation
- **Indexes**: Email (unique), role, verification status
- **Security**: Password hashing, 2FA support, session management

#### Reports Collection
- **Purpose**: Store corruption reports and investigations
- **Validation**: Title/description length, category validation, location data
- **Indexes**: Text search, category, status, location, date
- **Features**: Geospatial queries, status tracking, evidence management

## Security Best Practices

### 1. Authentication & Authorization
- Strong password requirements (8+ chars, mixed case, numbers)
- Account lockout after failed attempts
- Two-factor authentication support
- Role-based access control

### 2. Data Protection
- Password hashing with bcrypt (12 rounds in production)
- Sensitive data exclusion from queries
- Input validation and sanitization
- SQL injection prevention

### 3. Connection Security
- SSL/TLS encryption for production
- Connection pooling limits
- Timeout configurations
- Network access restrictions

### 4. Monitoring & Logging
- Security event logging
- Failed login attempt tracking
- Database health monitoring
- Performance metrics

## Performance Optimization

### 1. Indexing Strategy
```javascript
// Text search indexes
{ title: 'text', description: 'text' }

// Compound indexes for common queries
{ status: 1, priority: 1, createdAt: -1 }
{ category: 1, 'location.state': 1, status: 1 }

// Geospatial index for location queries
{ 'location.coordinates': '2dsphere' }
```

### 2. Connection Pooling
- Max pool size: 10 connections
- Min pool size: 2 connections
- Idle timeout: 30 seconds

### 3. Query Optimization
- Use projection to limit returned fields
- Implement pagination for large result sets
- Use aggregation pipeline for complex queries
- Cache frequently accessed data

## Backup & Recovery

### 1. Backup Strategy
```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/anticorruption" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### 2. Recovery
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/anticorruption" /backup/20240115/anticorruption
```

## Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check port availability
netstat -an | grep 27017

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Authentication Failed
- Verify username/password in connection string
- Check authentication database (authSource)
- Ensure user has proper permissions

#### Performance Issues
- Check slow query logs
- Analyze index usage with explain()
- Monitor connection pool metrics
- Review query patterns

### Health Check Endpoints

#### Server Health
```bash
GET /health
```

#### Database Status
```bash
GET /api/status/database
```

## Development vs Production

### Development
- No authentication required
- Relaxed security settings
- Detailed error messages
- Local MongoDB instance

### Production
- Strong authentication required
- SSL/TLS encryption
- Error message sanitization
- MongoDB Atlas or secured instance
- Regular backups
- Monitoring and alerting

## Migration Scripts

For database schema changes, create migration scripts in `backend/migrations/`:

```javascript
// Example migration: add-user-preferences.js
const { MongoClient } = require('mongodb');

async function up(db) {
  await db.collection('users').updateMany(
    { preferences: { $exists: false } },
    {
      $set: {
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          profileVisibility: 'public',
          defaultDashboard: 'overview'
        }
      }
    }
  );
}

async function down(db) {
  await db.collection('users').updateMany(
    {},
    { $unset: { preferences: 1 } }
  );
}

module.exports = { up, down };
```

## Support

For additional help:
1. Check MongoDB documentation: https://docs.mongodb.com/
2. Review application logs in `backend/logs/`
3. Use MongoDB Compass for visual database management
4. Monitor performance with MongoDB Atlas or self-hosted monitoring tools
