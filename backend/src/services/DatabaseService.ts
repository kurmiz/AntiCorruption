import { databaseManager } from '../config/database';
import User, { IUser } from '../models/User';
import Report, { IReport } from '../models/Report';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

/**
 * Database Service Layer
 * 
 * Provides high-level database operations with:
 * - Error handling and logging
 * - Data validation
 * - Performance optimization
 * - Security best practices
 */

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Health and Status Methods
  async getHealthStatus(): Promise<{
    isConnected: boolean;
    status: string;
    stats?: any;
  }> {
    try {
      const isHealthy = await databaseManager.healthCheck();
      const connectionStatus = databaseManager.getConnectionStatus();
      
      if (isHealthy) {
        const stats = await databaseManager.getStats();
        return {
          isConnected: true,
          status: 'healthy',
          stats
        };
      } else {
        return {
          isConnected: false,
          status: 'unhealthy'
        };
      }
    } catch (error) {
      logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        isConnected: false,
        status: 'error'
      };
    }
  }

  // User Operations
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      await user.save();
      logger.info('User created successfully', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error: error instanceof Error ? error.message : 'Unknown error', userData });
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      return user;
    } catch (error) {
      logger.error('Error finding user by email', { error: error instanceof Error ? error.message : 'Unknown error', email });
      throw error;
    }
  }

  async findUserById(userId: string | Types.ObjectId): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      logger.error('Error finding user by ID', { error: error instanceof Error ? error.message : 'Unknown error', userId });
      throw error;
    }
  }

  async updateUser(userId: string | Types.ObjectId, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData, lastUpdatedBy: userId },
        { new: true, runValidators: true }
      );
      
      if (user) {
        logger.info('User updated successfully', { userId: user._id });
      }
      
      return user;
    } catch (error) {
      logger.error('Error updating user', { error: error instanceof Error ? error.message : 'Unknown error', userId });
      throw error;
    }
  }

  async updateUserPreferences(userId: string | Types.ObjectId, preferences: Partial<IUser['preferences']>): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences } },
        { new: true, runValidators: true }
      );
      
      if (user) {
        logger.info('User preferences updated', { userId: user._id });
      }
      
      return user;
    } catch (error) {
      logger.error('Error updating user preferences', { error: error instanceof Error ? error.message : 'Unknown error', userId });
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<IUser[]> {
    try {
      const users = await User.find({ role, isVerified: true }).sort({ createdAt: -1 });
      return users;
    } catch (error) {
      logger.error('Error getting users by role', { error: error instanceof Error ? error.message : 'Unknown error', role });
      throw error;
    }
  }

  // Report Operations
  async createReport(reportData: Partial<IReport>): Promise<IReport> {
    try {
      const report = new Report(reportData);
      await report.save();
      logger.info('Report created successfully', { reportId: report._id, category: report.category });
      return report;
    } catch (error) {
      logger.error('Error creating report', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async findReportById(reportId: string | Types.ObjectId): Promise<IReport | null> {
    try {
      const report = await Report.findById(reportId)
        .populate('reporterId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('investigationNotes.addedBy', 'firstName lastName')
        .populate('messages.sender', 'firstName lastName');
      
      return report;
    } catch (error) {
      logger.error('Error finding report by ID', { error: error instanceof Error ? error.message : 'Unknown error', reportId });
      throw error;
    }
  }

  async getReportsByUser(userId: string | Types.ObjectId, page: number = 1, limit: number = 10): Promise<{
    reports: IReport[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [reports, total] = await Promise.all([
        Report.find({ reporterId: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('assignedTo', 'firstName lastName'),
        Report.countDocuments({ reporterId: userId })
      ]);

      return {
        reports,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting reports by user', { error: error instanceof Error ? error.message : 'Unknown error', userId });
      throw error;
    }
  }

  async getReportsByStatus(status: string, page: number = 1, limit: number = 10): Promise<{
    reports: IReport[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [reports, total] = await Promise.all([
        Report.find({ status })
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('reporterId', 'firstName lastName')
          .populate('assignedTo', 'firstName lastName'),
        Report.countDocuments({ status })
      ]);

      return {
        reports,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting reports by status', { error: error instanceof Error ? error.message : 'Unknown error', status });
      throw error;
    }
  }

  async searchReports(query: string, filters: any = {}, page: number = 1, limit: number = 10): Promise<{
    reports: IReport[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build search criteria
      const searchCriteria: any = {
        $text: { $search: query },
        ...filters
      };

      const [reports, total] = await Promise.all([
        Report.find(searchCriteria)
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('reporterId', 'firstName lastName')
          .populate('assignedTo', 'firstName lastName'),
        Report.countDocuments(searchCriteria)
      ]);

      return {
        reports,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error searching reports', { error: error instanceof Error ? error.message : 'Unknown error', query });
      throw error;
    }
  }

  async updateReportStatus(
    reportId: string | Types.ObjectId, 
    status: string, 
    changedBy: Types.ObjectId, 
    reason?: string, 
    notes?: string
  ): Promise<IReport | null> {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      await report.addStatusUpdate(status, changedBy, reason, notes);
      logger.info('Report status updated', { reportId, status, changedBy });
      
      return report;
    } catch (error) {
      logger.error('Error updating report status', { error: error instanceof Error ? error.message : 'Unknown error', reportId });
      throw error;
    }
  }

  // Analytics and Statistics
  async getReportStatistics(): Promise<{
    totalReports: number;
    reportsByStatus: any;
    reportsByCategory: any;
    reportsByPriority: any;
    recentReports: number;
  }> {
    try {
      const [
        totalReports,
        reportsByStatus,
        reportsByCategory,
        reportsByPriority,
        recentReports
      ] = await Promise.all([
        Report.countDocuments(),
        Report.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Report.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Report.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Report.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalReports,
        reportsByStatus,
        reportsByCategory,
        reportsByPriority,
        recentReports
      };
    } catch (error) {
      logger.error('Error getting report statistics', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async getUserStatistics(): Promise<{
    totalUsers: number;
    usersByRole: any;
    verifiedUsers: number;
    activeUsers: number;
  }> {
    try {
      const [
        totalUsers,
        usersByRole,
        verifiedUsers,
        activeUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalUsers,
        usersByRole,
        verifiedUsers,
        activeUsers
      };
    } catch (error) {
      logger.error('Error getting user statistics', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
