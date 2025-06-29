import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { databaseManager } from './config/database';
import { databaseService } from './services/DatabaseService';
import { WebSocketService, webSocketService } from './services/websocket';
import { analyticsService } from './services/analytics';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Apply security middleware
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Health check routes
app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await databaseService.getHealthStatus();
    const serverStatus = {
      server: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(healthStatus.isConnected ? 200 : 503).json({
      success: healthStatus.isConnected,
      data: {
        server: serverStatus,
        database: healthStatus
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      data: {
        server: 'running',
        database: { isConnected: false, status: 'error' }
      }
    });
  }
});

// Database status endpoint
app.get('/api/status/database', async (req: Request, res: Response) => {
  try {
    const [healthStatus, userStats, reportStats] = await Promise.all([
      databaseService.getHealthStatus(),
      databaseService.getUserStatistics(),
      databaseService.getReportStatistics()
    ]);

    res.json({
      success: true,
      data: {
        health: healthStatus,
        statistics: {
          users: userStats,
          reports: reportStats
        }
      }
    });
  } catch (error) {
    logger.error('Database status check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      message: 'Failed to get database status'
    });
  }
});

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Analytics endpoint
app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    logger.error('Analytics endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Real-time metrics endpoint
app.get('/api/analytics/realtime', async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: {
        realTimeMetrics: analyticsData.realTimeMetrics,
        connectedUsers: webSocketService?.getConnectedUsersCount() || 0
      }
    });
  } catch (error) {
    logger.error('Real-time analytics endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time analytics'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    code,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info('Starting Anti-Corruption Portal Backend Server...');

    // Connect to Database with enhanced connection manager
    await databaseManager.connect();

    // Verify database connection
    const healthStatus = await databaseService.getHealthStatus();
    if (!healthStatus.isConnected) {
      throw new Error('Database connection failed');
    }

    logger.info('Database connected successfully', {
      status: healthStatus.status,
      collections: healthStatus.stats?.collections || 0
    });

    // Initialize WebSocket service
    const wsService = new WebSocketService(server);
    // Make it globally available
    (global as any).webSocketService = wsService;

    // Start listening
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        healthEndpoint: `http://localhost:${PORT}/health`,
        apiEndpoint: `http://localhost:${PORT}/api`,
        websocket: 'enabled'
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await databaseManager.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: error instanceof Error ? error.message : 'Unknown error' });
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
};

startServer();
