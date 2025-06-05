import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * MongoDB Configuration and Connection Management
 *
 * MongoDB Version: 7.0+
 * Mongoose Version: 8.0+
 *
 * Features:
 * - Connection pooling
 * - Automatic reconnection
 * - Error handling and logging
 * - Security configurations
 * - Performance optimizations
 */

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 5;
  private retryDelay: number = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get MongoDB connection configuration
   */
  private getConfig(): DatabaseConfig {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/anticorruption';

    const options: mongoose.ConnectOptions = {
      // Connection Pool Settings
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,

      // Timeout Settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,

      // Buffering Settings
      bufferCommands: false,

      // Authentication (if using authentication)
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
    };

    return { uri: mongoUri, options };
  }

  /**
   * Connect to MongoDB with retry logic
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    const config = this.getConfig();

    try {
      this.connectionAttempts++;
      logger.info(`Attempting to connect to MongoDB (attempt ${this.connectionAttempts}/${this.maxRetries})`);

      await mongoose.connect(config.uri, config.options);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Successfully connected to MongoDB', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name
      });

      // Set up connection event listeners
      this.setupEventListeners();

    } catch (error) {
      logger.error('Failed to connect to MongoDB', {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        logger.error('Max connection attempts reached. Exiting application.');
        process.exit(1);
      }
    }
  }

  /**
   * Set up MongoDB connection event listeners
   */
  private setupEventListeners(): void {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      logger.info('MongoDB connection established');
      this.isConnected = true;
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost');
      this.isConnected = false;
    });

    connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    connection.on('error', (error) => {
      logger.error('MongoDB connection error', {
        error: error.message,
        stack: error.stack
      });
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Gracefully close database connection
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    await this.disconnect();
    process.exit(0);
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    database?: string;
  } {
    const connection = mongoose.connection;
    return {
      isConnected: this.isConnected,
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      database: connection.name
    };
  }

  /**
   * Health check for database connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !mongoose.connection.db) {
        return false;
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    try {
      if (!this.isConnected || !mongoose.connection.db) {
        throw new Error('Database not connected');
      }

      const stats = await mongoose.connection.db.stats();
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        objects: stats.objects
      };
    } catch (error) {
      logger.error('Failed to get database stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Export connection function for backward compatibility
export const connectDB = () => databaseManager.connect();

// Export mongoose for model definitions
export { mongoose };
