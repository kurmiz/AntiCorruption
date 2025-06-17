import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { IUser } from '../models/User';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
  userRole?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket service initialized');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next: any) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          // Allow anonymous connections for public features
          socket.userId = 'anonymous';
          socket.userRole = 'anonymous';
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      logger.info('User connected to WebSocket', {
        socketId: socket.id,
        userId: socket.userId,
        userRole: socket.userRole
      });

      // Store connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
      }

      // Join user-specific room
      if (socket.userId && socket.userId !== 'anonymous') {
        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);
      }

      // Join public rooms for real-time updates
      socket.join('public:reports');
      socket.join('public:analytics');

      // Handle report submission events
      socket.on('report:submit', (data: any) => {
        this.handleReportSubmission(socket, data);
      });

      // Handle report status updates
      socket.on('report:status:update', (data: any) => {
        this.handleReportStatusUpdate(socket, data);
      });

      // Handle real-time messaging
      socket.on('message:send', (data: any) => {
        this.handleMessageSend(socket, data);
      });

      // Handle analytics requests
      socket.on('analytics:subscribe', (data: any) => {
        this.handleAnalyticsSubscription(socket, data);
      });

      // Handle location-based subscriptions
      socket.on('location:subscribe', (data: any) => {
        this.handleLocationSubscription(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('User disconnected from WebSocket', {
          socketId: socket.id,
          userId: socket.userId
        });

        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.cleanupUserRooms(socket.userId);
        }
      });
    });
  }

  // Real-time report submission
  private handleReportSubmission(socket: any, data: any) {
    try {
      logger.info('Real-time report submission', {
        userId: socket.userId,
        reportData: data
      });

      // Emit to all connected users in public room
      this.io.to('public:reports').emit('report:new', {
        id: data.id,
        title: data.title,
        category: data.category,
        location: data.location,
        timestamp: new Date(),
        isAnonymous: data.isAnonymous
      });

      // Emit to role-specific rooms
      this.io.to('role:police').emit('report:new:police', data);
      this.io.to('role:admin').emit('report:new:admin', data);

      // Location-based notifications
      if (data.location) {
        const locationRoom = `location:${data.location.city}:${data.location.state}`;
        this.io.to(locationRoom).emit('report:new:location', data);
      }

    } catch (error) {
      logger.error('Error handling report submission:', error);
      socket.emit('error', { message: 'Failed to process report submission' });
    }
  }

  // Real-time status updates
  private handleReportStatusUpdate(socket: any, data: any) {
    try {
      logger.info('Real-time report status update', {
        userId: socket.userId,
        reportId: data.reportId,
        newStatus: data.status
      });

      // Emit to report owner
      if (data.reporterId) {
        this.io.to(`user:${data.reporterId}`).emit('report:status:updated', data);
      }

      // Emit to assigned investigator
      if (data.assignedTo) {
        this.io.to(`user:${data.assignedTo}`).emit('report:status:updated', data);
      }

      // Emit to public room for transparency
      this.io.to('public:reports').emit('report:status:public', {
        reportId: data.reportId,
        status: data.status,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling status update:', error);
      socket.emit('error', { message: 'Failed to process status update' });
    }
  }

  // Real-time messaging
  private handleMessageSend(socket: any, data: any) {
    try {
      logger.info('Real-time message send', {
        senderId: socket.userId,
        receiverId: data.receiverId,
        reportId: data.reportId
      });

      // Send to specific user
      if (data.receiverId) {
        this.io.to(`user:${data.receiverId}`).emit('message:received', {
          ...data,
          senderId: socket.userId,
          timestamp: new Date()
        });
      }

      // Send to report participants
      if (data.reportId) {
        this.io.to(`report:${data.reportId}`).emit('message:report', data);
      }

    } catch (error) {
      logger.error('Error handling message send:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Analytics subscription
  private handleAnalyticsSubscription(socket: any, data: any) {
    try {
      const { type, filters } = data;
      
      // Join analytics room
      socket.join(`analytics:${type}`);
      
      // Store subscription preferences
      if (!this.userRooms.has(socket.userId!)) {
        this.userRooms.set(socket.userId!, new Set());
      }
      this.userRooms.get(socket.userId!)!.add(`analytics:${type}`);

      logger.info('User subscribed to analytics', {
        userId: socket.userId,
        analyticsType: type,
        filters
      });

    } catch (error) {
      logger.error('Error handling analytics subscription:', error);
      socket.emit('error', { message: 'Failed to subscribe to analytics' });
    }
  }

  // Location-based subscription
  private handleLocationSubscription(socket: any, data: any) {
    try {
      const { city, state, radius } = data;
      const locationRoom = `location:${city}:${state}`;
      
      socket.join(locationRoom);
      
      logger.info('User subscribed to location updates', {
        userId: socket.userId,
        location: { city, state, radius }
      });

    } catch (error) {
      logger.error('Error handling location subscription:', error);
      socket.emit('error', { message: 'Failed to subscribe to location updates' });
    }
  }

  // Public methods for external use
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public emitToPublic(event: string, data: any) {
    this.io.to('public:reports').emit(event, data);
  }

  public emitAnalyticsUpdate(type: string, data: any) {
    this.io.to(`analytics:${type}`).emit('analytics:update', data);
  }

  public emitLocationUpdate(city: string, state: string, data: any) {
    this.io.to(`location:${city}:${state}`).emit('location:update', data);
  }

  private cleanupUserRooms(userId: string) {
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.forEach(room => {
        // Additional cleanup if needed
      });
      this.userRooms.delete(userId);
    }
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUsersByRole(role: string): number {
    let count = 0;
    this.connectedUsers.forEach(socket => {
      if (socket.userRole === role) count++;
    });
    return count;
  }
}

export let webSocketService: WebSocketService;
