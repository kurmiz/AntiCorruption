/**
 * MongoDB Setup Script
 * 
 * This script sets up the MongoDB database with:
 * - Database creation
 * - Collection creation with validation
 * - Index creation for performance
 * - Initial data seeding (optional)
 * - User roles and permissions
 * 
 * Usage:
 * node scripts/setup-mongodb.js
 * 
 * Requirements:
 * - MongoDB 7.0+ running locally or connection string in .env
 * - Node.js environment with required dependencies
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anticorruption';
const DB_NAME = 'anticorruption';

async function setupMongoDB() {
  let client;
  
  try {
    console.log('🚀 Starting MongoDB setup...');
    console.log(`📡 Connecting to: ${MONGODB_URI}`);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    
    // Create collections with validation
    await createCollections(db);
    
    // Create indexes for performance
    await createIndexes(db);
    
    // Seed initial data
    await seedInitialData(db);
    
    console.log('🎉 MongoDB setup completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB setup failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 MongoDB connection closed');
    }
  }
}

async function createCollections(db) {
  console.log('📋 Creating collections with validation...');
  
  // Users collection with validation
  try {
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'role'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
              description: 'Must be a valid email address'
            },
            password: {
              bsonType: 'string',
              minLength: 8,
              description: 'Password must be at least 8 characters'
            },
            firstName: {
              bsonType: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'First name must be 2-50 characters'
            },
            lastName: {
              bsonType: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Last name must be 2-50 characters'
            },
            role: {
              bsonType: 'string',
              enum: ['citizen', 'police', 'admin'],
              description: 'Role must be citizen, police, or admin'
            },
            isVerified: {
              bsonType: 'bool',
              description: 'Email verification status'
            }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log('  ✅ Users collection created');
  } catch (error) {
    if (error.code === 48) {
      console.log('  ℹ️  Users collection already exists');
    } else {
      throw error;
    }
  }
  
  // Reports collection with validation
  try {
    await db.createCollection('reports', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'description', 'category', 'incidentDate', 'location'],
          properties: {
            title: {
              bsonType: 'string',
              minLength: 10,
              maxLength: 200,
              description: 'Title must be 10-200 characters'
            },
            description: {
              bsonType: 'string',
              minLength: 50,
              maxLength: 5000,
              description: 'Description must be 50-5000 characters'
            },
            category: {
              bsonType: 'string',
              enum: ['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'],
              description: 'Must be a valid category'
            },
            status: {
              bsonType: 'string',
              enum: ['pending', 'under_investigation', 'resolved', 'rejected', 'closed'],
              description: 'Must be a valid status'
            },
            priority: {
              bsonType: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Must be a valid priority level'
            },
            incidentDate: {
              bsonType: 'date',
              description: 'Incident date is required'
            },
            location: {
              bsonType: 'object',
              required: ['address', 'city', 'state', 'country'],
              properties: {
                address: { bsonType: 'string' },
                city: { bsonType: 'string' },
                state: { bsonType: 'string' },
                country: { bsonType: 'string' }
              }
            }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log('  ✅ Reports collection created');
  } catch (error) {
    if (error.code === 48) {
      console.log('  ℹ️  Reports collection already exists');
    } else {
      throw error;
    }
  }
}

async function createIndexes(db) {
  console.log('🔍 Creating indexes for performance...');
  
  // User indexes
  const usersCollection = db.collection('users');
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await usersCollection.createIndex({ role: 1 });
  await usersCollection.createIndex({ isVerified: 1 });
  await usersCollection.createIndex({ lastLogin: -1 });
  await usersCollection.createIndex({ createdAt: -1 });
  await usersCollection.createIndex({ 'securityLog.timestamp': -1 });
  await usersCollection.createIndex({ 'activeSessions.lastActive': -1 });
  
  // Compound indexes for users
  await usersCollection.createIndex({ email: 1, isVerified: 1 });
  await usersCollection.createIndex({ role: 1, isVerified: 1 });
  
  console.log('  ✅ User indexes created');
  
  // Report indexes
  const reportsCollection = db.collection('reports');
  await reportsCollection.createIndex({ title: 'text', description: 'text' });
  await reportsCollection.createIndex({ category: 1, status: 1 });
  await reportsCollection.createIndex({ reporterId: 1, createdAt: -1 });
  await reportsCollection.createIndex({ assignedTo: 1, status: 1 });
  await reportsCollection.createIndex({ incidentDate: -1 });
  await reportsCollection.createIndex({ 'location.city': 1, 'location.state': 1 });
  await reportsCollection.createIndex({ priority: 1, status: 1 });
  await reportsCollection.createIndex({ isAnonymous: 1 });
  await reportsCollection.createIndex({ publicVisibility: 1 });
  await reportsCollection.createIndex({ urgencyLevel: -1 });
  
  // Compound indexes for reports
  await reportsCollection.createIndex({ status: 1, priority: 1, createdAt: -1 });
  await reportsCollection.createIndex({ category: 1, 'location.state': 1, status: 1 });
  
  // Geospatial index for location-based queries
  await reportsCollection.createIndex({ 'location.coordinates': '2dsphere' });
  
  console.log('  ✅ Report indexes created');
}

async function seedInitialData(db) {
  console.log('🌱 Seeding initial data...');
  
  const usersCollection = db.collection('users');
  
  // Check if admin user already exists
  const existingAdmin = await usersCollection.findOne({ email: 'admin@anticorruption.gov' });
  
  if (!existingAdmin) {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    
    const adminUser = {
      email: 'admin@anticorruption.gov',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isVerified: true,
      twoFactorEnabled: false,
      loginAttempts: 0,
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: false,
        profileVisibility: 'private',
        defaultDashboard: 'overview'
      },
      securityLog: [],
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(adminUser);
    console.log('  ✅ Default admin user created');
    console.log('  📧 Email: admin@anticorruption.gov');
    console.log('  🔑 Password: Admin@123456');
    console.log('  ⚠️  Please change the default password after first login!');
  } else {
    console.log('  ℹ️  Admin user already exists');
  }
  
  // Create sample police user
  const existingPolice = await usersCollection.findOne({ email: 'police@anticorruption.gov' });
  
  if (!existingPolice) {
    const hashedPassword = await bcrypt.hash('Police@123456', 12);
    
    const policeUser = {
      email: 'police@anticorruption.gov',
      password: hashedPassword,
      firstName: 'Police',
      lastName: 'Officer',
      role: 'police',
      isVerified: true,
      twoFactorEnabled: false,
      loginAttempts: 0,
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        profileVisibility: 'public',
        defaultDashboard: 'reports'
      },
      securityLog: [],
      activeSessions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(policeUser);
    console.log('  ✅ Default police user created');
    console.log('  📧 Email: police@anticorruption.gov');
    console.log('  🔑 Password: Police@123456');
  } else {
    console.log('  ℹ️  Police user already exists');
  }
}

// Run the setup
if (require.main === module) {
  setupMongoDB();
}

module.exports = { setupMongoDB };
