import { Types } from 'mongoose';
import Report from '../models/Report';
import User from '../models/User';
import { logger } from '../utils/logger';
import { webSocketService } from './websocket';

export interface AnalyticsData {
  totalReports: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  reportsByCategory: CategoryAnalytics[];
  reportsByStatus: StatusAnalytics[];
  reportsByLocation: LocationAnalytics[];
  reportsByPriority: PriorityAnalytics[];
  resolutionTimeAnalytics: ResolutionTimeAnalytics;
  userEngagementMetrics: UserEngagementMetrics;
  trendAnalytics: TrendAnalytics;
  realTimeMetrics: RealTimeMetrics;
}

export interface CategoryAnalytics {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  avgResolutionTime: number;
}

export interface StatusAnalytics {
  status: string;
  count: number;
  percentage: number;
  avgTimeInStatus: number;
}

export interface LocationAnalytics {
  city: string;
  state: string;
  count: number;
  categories: { [key: string]: number };
  coordinates?: { lat: number; lng: number };
}

export interface PriorityAnalytics {
  priority: string;
  count: number;
  avgResolutionTime: number;
  escalationRate: number;
}

export interface ResolutionTimeAnalytics {
  average: number;
  median: number;
  fastest: number;
  slowest: number;
  byCategory: { [key: string]: number };
  byPriority: { [key: string]: number };
}

export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  reportSubmissionRate: number;
  averageReportsPerUser: number;
}

export interface TrendAnalytics {
  daily: DailyTrend[];
  weekly: WeeklyTrend[];
  monthly: MonthlyTrend[];
  yearly: YearlyTrend[];
}

export interface DailyTrend {
  date: string;
  count: number;
  categories: { [key: string]: number };
}

export interface WeeklyTrend {
  week: string;
  count: number;
  change: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  change: number;
}

export interface YearlyTrend {
  year: string;
  count: number;
  change: number;
}

export interface RealTimeMetrics {
  reportsLastHour: number;
  reportsLast24Hours: number;
  activeUsers: number;
  pendingReports: number;
  urgentReports: number;
  averageResponseTime: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get comprehensive analytics data
  public async getAnalyticsData(filters?: any): Promise<AnalyticsData> {
    try {
      const cacheKey = `analytics:${JSON.stringify(filters || {})}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }

      logger.info('Generating analytics data', { filters });

      const [
        totalReports,
        reportsToday,
        reportsThisWeek,
        reportsThisMonth,
        categoryAnalytics,
        statusAnalytics,
        locationAnalytics,
        priorityAnalytics,
        resolutionTimeAnalytics,
        userEngagementMetrics,
        trendAnalytics,
        realTimeMetrics
      ] = await Promise.all([
        this.getTotalReports(filters),
        this.getReportsToday(filters),
        this.getReportsThisWeek(filters),
        this.getReportsThisMonth(filters),
        this.getCategoryAnalytics(filters),
        this.getStatusAnalytics(filters),
        this.getLocationAnalytics(filters),
        this.getPriorityAnalytics(filters),
        this.getResolutionTimeAnalytics(filters),
        this.getUserEngagementMetrics(filters),
        this.getTrendAnalytics(filters),
        this.getRealTimeMetrics(filters)
      ]);

      const analyticsData: AnalyticsData = {
        totalReports,
        reportsToday,
        reportsThisWeek,
        reportsThisMonth,
        reportsByCategory: categoryAnalytics,
        reportsByStatus: statusAnalytics,
        reportsByLocation: locationAnalytics,
        reportsByPriority: priorityAnalytics,
        resolutionTimeAnalytics,
        userEngagementMetrics,
        trendAnalytics,
        realTimeMetrics
      };

      this.setCachedData(cacheKey, analyticsData);
      return analyticsData;

    } catch (error) {
      logger.error('Error generating analytics data:', error);
      throw error;
    }
  }

  // Real-time metrics
  private async getRealTimeMetrics(filters?: any): Promise<RealTimeMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      reportsLastHour,
      reportsLast24Hours,
      pendingReports,
      urgentReports
    ] = await Promise.all([
      Report.countDocuments({ 
        createdAt: { $gte: oneHourAgo },
        ...this.buildFilter(filters)
      }),
      Report.countDocuments({ 
        createdAt: { $gte: twentyFourHoursAgo },
        ...this.buildFilter(filters)
      }),
      Report.countDocuments({ 
        status: 'pending',
        ...this.buildFilter(filters)
      }),
      Report.countDocuments({ 
        urgencyLevel: { $gte: 8 },
        ...this.buildFilter(filters)
      })
    ]);

    return {
      reportsLastHour,
      reportsLast24Hours,
      activeUsers: webSocketService?.getConnectedUsersCount() || 0,
      pendingReports,
      urgentReports,
      averageResponseTime: await this.calculateAverageResponseTime(filters)
    };
  }

  // Category analytics
  private async getCategoryAnalytics(filters?: any): Promise<CategoryAnalytics[]> {
    const pipeline: any[] = [
      { $match: this.buildFilter(filters) },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      { $sort: { count: -1 as any } }
    ];

    const results = await Report.aggregate(pipeline);
    const total = results.reduce((sum, item) => sum + item.count, 0);

    return Promise.all(results.map(async item => ({
      category: item._id,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
      trend: await this.calculateCategoryTrend(item._id, filters),
      avgResolutionTime: item.avgResolutionTime || 0
    })));
  }

  // Location analytics with geospatial data
  private async getLocationAnalytics(filters?: any): Promise<LocationAnalytics[]> {
    const pipeline: any[] = [
      { $match: this.buildFilter(filters) },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state'
          },
          count: { $sum: 1 },
          categories: {
            $push: '$category'
          },
          coordinates: { $first: '$location.coordinates' }
        }
      },
      { $sort: { count: -1 as any } },
      { $limit: 50 }
    ];

    const results = await Report.aggregate(pipeline);

    return results.map(item => {
      const categoryCount: { [key: string]: number } = {};
      item.categories.forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      return {
        city: item._id.city,
        state: item._id.state,
        count: item.count,
        categories: categoryCount,
        coordinates: item.coordinates
      };
    });
  }

  // Trend analytics
  private async getTrendAnalytics(filters?: any): Promise<TrendAnalytics> {
    const [daily, weekly, monthly, yearly] = await Promise.all([
      this.getDailyTrends(filters),
      this.getWeeklyTrends(filters),
      this.getMonthlyTrends(filters),
      this.getYearlyTrends(filters)
    ]);

    return { daily, weekly, monthly, yearly };
  }

  // Helper methods
  private buildFilter(filters?: any): any {
    const filter: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      filter.createdAt = {};
      if (filters.startDate) filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate);
    }
    
    if (filters?.category) filter.category = filters.category;
    if (filters?.status) filter.status = filters.status;
    if (filters?.priority) filter.priority = filters.priority;
    if (filters?.city) filter['location.city'] = new RegExp(filters.city, 'i');
    if (filters?.state) filter['location.state'] = new RegExp(filters.state, 'i');
    
    return filter;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Placeholder methods (implement based on specific requirements)
  private async getTotalReports(filters?: any): Promise<number> {
    return Report.countDocuments(this.buildFilter(filters));
  }

  private async getReportsToday(filters?: any): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Report.countDocuments({
      createdAt: { $gte: today },
      ...this.buildFilter(filters)
    });
  }

  private async getReportsThisWeek(filters?: any): Promise<number> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return Report.countDocuments({
      createdAt: { $gte: weekStart },
      ...this.buildFilter(filters)
    });
  }

  private async getReportsThisMonth(filters?: any): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return Report.countDocuments({
      createdAt: { $gte: monthStart },
      ...this.buildFilter(filters)
    });
  }

  private async getStatusAnalytics(filters?: any): Promise<StatusAnalytics[]> {
    // Implementation for status analytics
    return [];
  }

  private async getPriorityAnalytics(filters?: any): Promise<PriorityAnalytics[]> {
    // Implementation for priority analytics
    return [];
  }

  private async getResolutionTimeAnalytics(filters?: any): Promise<ResolutionTimeAnalytics> {
    // Implementation for resolution time analytics
    return {
      average: 0,
      median: 0,
      fastest: 0,
      slowest: 0,
      byCategory: {},
      byPriority: {}
    };
  }

  private async getUserEngagementMetrics(filters?: any): Promise<UserEngagementMetrics> {
    // Implementation for user engagement metrics
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      reportSubmissionRate: 0,
      averageReportsPerUser: 0
    };
  }

  private async getDailyTrends(filters?: any): Promise<DailyTrend[]> {
    // Implementation for daily trends
    return [];
  }

  private async getWeeklyTrends(filters?: any): Promise<WeeklyTrend[]> {
    // Implementation for weekly trends
    return [];
  }

  private async getMonthlyTrends(filters?: any): Promise<MonthlyTrend[]> {
    // Implementation for monthly trends
    return [];
  }

  private async getYearlyTrends(filters?: any): Promise<YearlyTrend[]> {
    // Implementation for yearly trends
    return [];
  }

  private async calculateCategoryTrend(category: string, filters?: any): Promise<'up' | 'down' | 'stable'> {
    // Implementation for category trend calculation
    return 'stable';
  }

  private async calculateAverageResponseTime(filters?: any): Promise<number> {
    // Implementation for average response time calculation
    return 0;
  }

  // Real-time analytics updates
  public async broadcastAnalyticsUpdate(type: string, data?: any) {
    try {
      const analyticsData = await this.getAnalyticsData(data?.filters);
      webSocketService?.emitAnalyticsUpdate(type, analyticsData);
      logger.info('Analytics update broadcasted', { type });
    } catch (error) {
      logger.error('Error broadcasting analytics update:', error);
    }
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear();
    logger.info('Analytics cache cleared');
  }
}

export const analyticsService = AnalyticsService.getInstance();
