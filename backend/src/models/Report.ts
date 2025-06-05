import mongoose, { Schema, Document, Types } from 'mongoose';
import { logger } from '../utils/logger';

export interface IReport extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: 'bribery' | 'fraud' | 'embezzlement' | 'abuse_of_power' | 'nepotism' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under_investigation' | 'resolved' | 'rejected' | 'closed';
  
  // Reporter Information
  reporterId?: Types.ObjectId; // Optional for anonymous reports
  isAnonymous: boolean;
  reporterContact?: {
    email?: string;
    phone?: string;
    preferredMethod: 'email' | 'phone' | 'none';
  };
  
  // Incident Details
  incidentDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Involved Parties
  involvedParties: Array<{
    name: string;
    role: string;
    organization?: string;
    position?: string;
    contactInfo?: string;
  }>;
  
  // Evidence and Attachments
  evidence: Array<{
    type: 'document' | 'image' | 'video' | 'audio' | 'other';
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
    description?: string;
  }>;
  
  // Investigation Details
  assignedTo?: Types.ObjectId; // Police/Admin user
  investigationNotes: Array<{
    note: string;
    addedBy: Types.ObjectId;
    addedAt: Date;
    isPublic: boolean; // Whether visible to reporter
  }>;
  
  // Status History
  statusHistory: Array<{
    status: string;
    changedBy: Types.ObjectId;
    changedAt: Date;
    reason?: string;
    notes?: string;
  }>;
  
  // Communication
  messages: Array<{
    sender: Types.ObjectId;
    senderRole: 'reporter' | 'investigator' | 'admin';
    message: string;
    timestamp: Date;
    isRead: boolean;
    attachments?: Array<{
      filename: string;
      url: string;
      type: string;
    }>;
  }>;
  
  // Metadata
  tags: string[];
  estimatedLoss?: number;
  currency?: string;
  urgencyLevel: number; // 1-10 scale
  publicVisibility: boolean;
  
  // Tracking
  viewCount: number;
  lastViewedAt?: Date;
  lastUpdatedBy?: Types.ObjectId;
  
  // Resolution
  resolution?: {
    outcome: 'substantiated' | 'unsubstantiated' | 'inconclusive' | 'withdrawn';
    summary: string;
    actionTaken?: string;
    resolvedBy: Types.ObjectId;
    resolvedAt: Date;
    followUpRequired: boolean;
    followUpDate?: Date;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
  
  // Methods
  addStatusUpdate(status: string, changedBy: Types.ObjectId, reason?: string, notes?: string): Promise<void>;
  addInvestigationNote(note: string, addedBy: Types.ObjectId, isPublic?: boolean): Promise<void>;
  addMessage(sender: Types.ObjectId, senderRole: string, message: string): Promise<void>;
  incrementViewCount(): Promise<void>;
  canBeViewedBy(userId: Types.ObjectId, userRole: string): boolean;
}

const reportSchema = new Schema<IReport>({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: 'text', // Text index for search
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters long'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    index: 'text', // Text index for search
  },
  category: {
    type: String,
    required: [true, 'Report category is required'],
    enum: {
      values: ['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'],
      message: 'Invalid category selected'
    },
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'under_investigation', 'resolved', 'rejected', 'closed'],
    default: 'pending',
    index: true,
  },
  
  // Reporter Information
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
    index: true,
  },
  reporterContact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    preferredMethod: {
      type: String,
      enum: ['email', 'phone', 'none'],
      default: 'email',
    }
  },
  
  // Incident Details
  incidentDate: {
    type: Date,
    required: [true, 'Incident date is required'],
    index: true,
    validate: {
      validator: function(date: Date) {
        return date <= new Date();
      },
      message: 'Incident date cannot be in the future'
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Incident address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
      index: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      }
    }
  },
  
  // Involved Parties
  involvedParties: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    contactInfo: {
      type: String,
      trim: true,
    }
  }],
  
  // Evidence and Attachments
  evidence: [{
    type: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'other'],
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: 50 * 1024 * 1024, // 50MB limit
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    }
  }],
  
  // Investigation Details
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  investigationNotes: [{
    note: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: false,
    }
  }],

  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true,
      enum: ['pending', 'under_investigation', 'resolved', 'rejected', 'closed'],
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    }
  }],

  // Communication
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['reporter', 'investigator', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: [{
      filename: String,
      url: String,
      type: String,
    }]
  }],

  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  estimatedLoss: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
  },
  urgencyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  publicVisibility: {
    type: Boolean,
    default: false,
  },

  // Tracking
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastViewedAt: {
    type: Date,
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  // Resolution
  resolution: {
    outcome: {
      type: String,
      enum: ['substantiated', 'unsubstantiated', 'inconclusive', 'withdrawn'],
    },
    summary: {
      type: String,
      trim: true,
    },
    actionTaken: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    }
  }
}, {
  timestamps: true,
  collection: 'reports',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reportSchema.index({ title: 'text', description: 'text' }); // Text search
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ incidentDate: -1 });
reportSchema.index({ 'location.city': 1, 'location.state': 1 });
reportSchema.index({ priority: 1, status: 1 });
reportSchema.index({ isAnonymous: 1 });
reportSchema.index({ publicVisibility: 1 });
reportSchema.index({ urgencyLevel: -1 });

// Compound indexes
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ category: 1, 'location.state': 1, status: 1 });

// Geospatial index for location-based queries
reportSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for report age
reportSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = this.createdAt || new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for unread message count
reportSchema.virtual('unreadMessageCount').get(function() {
  return this.messages ? this.messages.filter((msg: any) => !msg.isRead).length : 0;
});

// Pre-save middleware
reportSchema.pre<IReport>('save', function (next) {
  try {
    // Initialize status history if empty
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({
        status: this.status,
        changedBy: this.reporterId || new mongoose.Types.ObjectId(),
        changedAt: new Date(),
        reason: 'Initial report submission'
      } as any);
    }

    // Limit arrays to prevent excessive growth
    if (this.investigationNotes.length > 100) {
      this.investigationNotes = this.investigationNotes.slice(-100);
    }

    if (this.messages.length > 200) {
      this.messages = this.messages.slice(-200);
    }

    if (this.statusHistory.length > 50) {
      this.statusHistory = this.statusHistory.slice(-50);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance Methods
reportSchema.methods.addStatusUpdate = async function (
  status: string,
  changedBy: Types.ObjectId,
  reason?: string,
  notes?: string
): Promise<void> {
  try {
    this.status = status;
    this.statusHistory.push({
      status,
      changedBy,
      changedAt: new Date(),
      reason,
      notes
    });
    this.lastUpdatedBy = changedBy;
    await this.save();
    logger.info('Status updated for report', { reportId: this._id, status, changedBy });
  } catch (error) {
    logger.error('Error updating report status', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

reportSchema.methods.addInvestigationNote = async function (
  note: string,
  addedBy: Types.ObjectId,
  isPublic: boolean = false
): Promise<void> {
  try {
    this.investigationNotes.push({
      note,
      addedBy,
      addedAt: new Date(),
      isPublic
    });
    this.lastUpdatedBy = addedBy;
    await this.save();
    logger.info('Investigation note added', { reportId: this._id, addedBy, isPublic });
  } catch (error) {
    logger.error('Error adding investigation note', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

reportSchema.methods.addMessage = async function (
  sender: Types.ObjectId,
  senderRole: string,
  message: string
): Promise<void> {
  try {
    this.messages.push({
      sender,
      senderRole,
      message,
      timestamp: new Date(),
      isRead: false
    });
    this.lastUpdatedBy = sender;
    await this.save();
    logger.info('Message added to report', { reportId: this._id, sender, senderRole });
  } catch (error) {
    logger.error('Error adding message', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

reportSchema.methods.incrementViewCount = async function (): Promise<void> {
  try {
    this.viewCount += 1;
    this.lastViewedAt = new Date();
    await this.save();
  } catch (error) {
    logger.error('Error incrementing view count', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

reportSchema.methods.canBeViewedBy = function (userId: Types.ObjectId, userRole: string): boolean {
  // Admin can view all reports
  if (userRole === 'admin') return true;

  // Police can view assigned reports and public reports
  if (userRole === 'police') {
    return this.assignedTo?.equals(userId) || this.publicVisibility;
  }

  // Citizens can view their own reports and public reports
  if (userRole === 'citizen') {
    return this.reporterId?.equals(userId) || this.publicVisibility;
  }

  return false;
};

// Static methods
reportSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

reportSchema.statics.findByStatus = function (status: string) {
  return this.find({ status });
};

reportSchema.statics.findByLocation = function (city: string, state?: string) {
  const query: any = { 'location.city': new RegExp(city, 'i') };
  if (state) {
    query['location.state'] = new RegExp(state, 'i');
  }
  return this.find(query);
};

reportSchema.statics.findNearLocation = function (latitude: number, longitude: number, maxDistance: number = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

// Create and export the model
const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report;
