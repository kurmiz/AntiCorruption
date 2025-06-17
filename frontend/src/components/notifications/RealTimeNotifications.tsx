import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  MapPin,
  Clock,
  Users,
  FileText,
  Zap
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'report_new' | 'report_status' | 'system' | 'location' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface RealTimeNotificationsProps {
  className?: string;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    initializeRealTimeConnection();
    initializeAudio();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeRealTimeConnection = () => {
    console.log('🔔 Initializing real-time notifications...');
    
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to real-time notifications');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from real-time notifications');
      setConnected(false);
    });

    // Listen for new reports
    socketRef.current.on('report:new', (data: any) => {
      console.log('📝 New report notification:', data);
      addNotification({
        type: 'report_new',
        title: 'New Report Submitted',
        message: `${data.title} - ${data.category}`,
        data: data,
        priority: data.urgencyLevel >= 8 ? 'critical' : data.urgencyLevel >= 6 ? 'high' : 'medium'
      });
    });

    // Listen for report status updates
    socketRef.current.on('report:status:public', (data: any) => {
      console.log('📋 Report status update:', data);
      addNotification({
        type: 'report_status',
        title: 'Report Status Updated',
        message: `Report status changed to ${data.status}`,
        data: data,
        priority: 'medium'
      });
    });

    // Listen for location-based updates
    socketRef.current.on('location:update', (data: any) => {
      console.log('📍 Location update:', data);
      addNotification({
        type: 'location',
        title: 'Local Area Update',
        message: `New ${data.type} in your area`,
        data: data,
        priority: 'medium'
      });
    });

    // Listen for analytics updates
    socketRef.current.on('analytics:update', (data: any) => {
      console.log('📊 Analytics update:', data);
      if (data.realTimeMetrics?.urgentReports > 0) {
        addNotification({
          type: 'urgent',
          title: 'Urgent Reports Alert',
          message: `${data.realTimeMetrics.urgentReports} urgent reports require attention`,
          data: data,
          priority: 'critical'
        });
      }
    });

    // Listen for system notifications
    socketRef.current.on('system:notification', (data: any) => {
      console.log('🔔 System notification:', data);
      addNotification({
        type: 'system',
        title: data.title,
        message: data.message,
        data: data,
        priority: data.priority || 'medium'
      });
    });
  };

  const initializeAudio = () => {
    // Create audio element for notification sounds
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.5;
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      ...notificationData
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only 50 notifications
    setUnreadCount(prev => prev + 1);

    // Play notification sound for high priority notifications
    if (notification.priority === 'critical' || notification.priority === 'high') {
      playNotificationSound();
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Auto-remove notification after 10 seconds for low priority
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 10000);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'critical') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    
    switch (type) {
      case 'report_new':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'report_status':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'location':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'urgent':
        return <Zap className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={`real-time-notifications ${className}`}>
      {/* Notification Bell */}
      <div className="notification-trigger">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <div className={`connection-dot ${connected ? 'connected' : 'disconnected'}`}></div>
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <div className="header-content">
              <h3>Notifications</h3>
              <div className="connection-status">
                <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
                <span>{connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="close-panel">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <Bell className="h-8 w-8 text-gray-400" />
                <p>No notifications yet</p>
                <span>You'll see real-time updates here</span>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityColor(notification.priority)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(notification.timestamp)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="remove-notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {notifications.length > 0 && (
                  <div className="notification-footer">
                    <button onClick={clearAllNotifications} className="clear-all">
                      Clear all notifications
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;
