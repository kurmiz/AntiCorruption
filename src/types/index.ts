// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  USER = 'user',
  POLICE = 'police',
  ADMIN = 'admin'
}

// Report Types
export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  priority: ReportPriority;
  location: Location;
  media: MediaFile[];
  submittedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  isAnonymous: boolean;
}

export enum ReportCategory {
  BRIBERY = 'bribery',
  EMBEZZLEMENT = 'embezzlement',
  FRAUD = 'fraud',
  ABUSE_OF_POWER = 'abuse_of_power',
  NEPOTISM = 'nepotism',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Location Types
export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Media Types
export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
  uploadedAt: string;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  reportId?: string;
  type: MessageType;
  isRead: boolean;
  createdAt: string;
  attachments?: MediaFile[];
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  UPDATE = 'update'
}

// Statistics Types
export interface Statistics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  rejectedReports: number;
  reportsThisMonth: number;
  reportsThisWeek: number;
  averageResolutionTime: number;
  reportsByCategory: CategoryStats[];
  reportsByStatus: StatusStats[];
  monthlyTrends: MonthlyTrend[];
}

export interface CategoryStats {
  category: ReportCategory;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: ReportStatus;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  reports: number;
  resolved: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: UserRole;
}

export interface ReportForm {
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  isAnonymous: boolean;
  media?: File[];
}

export interface MessageForm {
  content: string;
  receiverId: string;
  reportId?: string;
  attachments?: File[];
}

// Navigation Types
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Socket Types
export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

// Filter Types
export interface ReportFilters {
  status?: ReportStatus[];
  category?: ReportCategory[];
  priority?: ReportPriority[];
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  search?: string;
}

// Dashboard Types
export interface DashboardData {
  user: User;
  statistics: Statistics;
  recentReports: Report[];
  recentMessages: Message[];
  notifications: Notification[];
}
