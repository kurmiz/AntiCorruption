import { Request, Response } from 'express';
import Report, { IReport } from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';
import { analyticsService } from '../services/analytics';
import {
  validateReportInput,
  validateReportUpdate,
  validateReportId,
  handleValidationErrors,
  validateFileUpload,
  auditLog
} from '../middleware/validation';

// Helper function to parse FormData with dot notation
const parseFormDataWithDotNotation = (body: any) => {
  const result: any = {};

  Object.keys(body).forEach(key => {
    const value = body[key];

    if (key.includes('.')) {
      // Handle dot notation (e.g., "location.address")
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    } else {
      // Handle regular fields
      result[key] = value;
    }
  });

  return result;
};

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('🔍 DEBUGGING: Report creation request received', {
      body: req.body,
      files: req.files ? (req.files as any[]).map(f => ({ filename: f.filename, mimetype: f.mimetype, size: f.size })) : [],
      isAnonymous: req.body.isAnonymous,
      user: req.user ? req.user._id : 'anonymous',
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    // Parse FormData with dot notation support
    const parsedBody = parseFormDataWithDotNotation(req.body);

    const {
      title,
      description,
      category,
      incidentDate,
      location,
      isAnonymous = false,
      involvedParties = [],
      estimatedLoss,
      currency = 'INR',
      urgencyLevel = 5,
      tags = [],
      // Enhanced Submit Report Fields
      personsInvolved,
      departmentInvolved,
      monetaryValue,
      witnesses,
      contactInfo,
      previousComplaints = false,
      termsAccepted = false,
      isDraft = false
    } = parsedBody;

    // Validate required fields
    if (!title || title.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be at least 10 characters long'
      });
    }

    if (!description || description.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 50 characters long'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!incidentDate) {
      return res.status(400).json({
        success: false,
        message: 'Incident date is required'
      });
    }

    // Validate terms acceptance for non-draft reports
    if (!isDraft && !termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Terms and conditions must be accepted'
      });
    }

    // Parse location if it's a string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (error) {
        logger.error('Location parsing error', { location, error });
        return res.status(400).json({
          success: false,
          message: 'Invalid location format'
        });
      }
    }

    // Validate location
    if (!parsedLocation || !parsedLocation.address || !parsedLocation.city || !parsedLocation.state) {
      logger.warn('Location validation failed', {
        location: parsedLocation,
        hasAddress: !!parsedLocation?.address,
        hasCity: !!parsedLocation?.city,
        hasState: !!parsedLocation?.state
      });
      return res.status(400).json({
        success: false,
        message: 'Location with address, city, and state is required',
        details: {
          address: !parsedLocation?.address ? 'Address is required' : null,
          city: !parsedLocation?.city ? 'City is required' : null,
          state: !parsedLocation?.state ? 'State is required' : null
        }
      });
    }

    // Parse involved parties if it's a string
    let parsedInvolvedParties = involvedParties;
    if (typeof involvedParties === 'string') {
      try {
        parsedInvolvedParties = JSON.parse(involvedParties);
      } catch (error) {
        parsedInvolvedParties = [];
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = [];
      }
    }

    // Parse incident date
    const fullIncidentDate = new Date(incidentDate);

    // Handle file uploads
    const evidence: Array<{
      type: 'document' | 'image' | 'video' | 'audio' | 'other';
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      uploadedAt: Date;
      description?: string;
    }> = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        let fileType: 'document' | 'image' | 'video' | 'audio' | 'other' = 'other';

        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
          fileType = 'audio';
        } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
          fileType = 'document';
        }

        evidence.push({
          type: fileType,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/reports/${file.filename}`,
          uploadedAt: new Date(),
          description: `Evidence file: ${file.originalname}`
        });
      }
    }

    // Parse additional fields
    const parsedPersonsInvolved = personsInvolved ?
      (typeof personsInvolved === 'string' ? personsInvolved.split(',').map((p: string) => p.trim()).filter(Boolean) : personsInvolved) : [];

    const parsedWitnesses = witnesses ?
      (typeof witnesses === 'string' ? witnesses.split(',').map((w: string) => w.trim()).filter(Boolean) : witnesses) : [];

    // Create report data
    const reportData: Partial<IReport> = {
      title,
      description,
      category,
      incidentDate: fullIncidentDate,
      location: parsedLocation,
      isAnonymous,
      involvedParties: parsedInvolvedParties.length > 0 ? parsedInvolvedParties : parsedPersonsInvolved,
      evidence,
      estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : (monetaryValue ? parseFloat(monetaryValue) : undefined),
      currency,
      urgencyLevel: parseInt(urgencyLevel) || 5,
      tags: parsedTags,
      status: isDraft ? 'draft' : 'pending',
      priority: urgencyLevel >= 8 ? 'critical' : urgencyLevel >= 6 ? 'high' : urgencyLevel >= 4 ? 'medium' : 'low',
      publicVisibility: false,
      viewCount: 0,
      // Enhanced Submit Report Fields
      departmentInvolved,
      monetaryValue: monetaryValue ? parseFloat(monetaryValue) : undefined,
      witnesses: parsedWitnesses,
      contactInfo: (!isAnonymous && contactInfo) ? contactInfo : undefined,
      previousComplaints: previousComplaints === 'true' || previousComplaints === true,
      termsAccepted: termsAccepted === 'true' || termsAccepted === true,
      isDraft: isDraft === 'true' || isDraft === true
    };

    // Set reporter if not anonymous
    if (!isAnonymous && req.user) {
      reportData.reporterId = req.user._id;
    }

    // Create the report
    logger.info('🔍 DEBUGGING: Creating report with data', { reportData });

    const report = new Report(reportData);
    logger.info('🔍 DEBUGGING: Report object created, now saving...');

    const savedReport = await report.save();
    logger.info('🔍 DEBUGGING: Report saved successfully to MongoDB', {
      savedReportId: savedReport._id,
      savedReportData: savedReport.toObject()
    });

    // Populate reporter information for response
    await report.populate('reporterId', 'firstName lastName email');

    logger.info('✅ Report created successfully', {
      reportId: report._id,
      category: report.category,
      isAnonymous: report.isAnonymous,
      reporterId: report.reporterId,
      mongoDbId: savedReport._id
    });

    // Trigger real-time analytics update
    try {
      await analyticsService.broadcastAnalyticsUpdate('report:created', {
        reportId: report._id,
        category: report.category,
        location: report.location,
        urgencyLevel: report.urgencyLevel
      });
    } catch (analyticsError) {
      logger.warn('Failed to broadcast analytics update:', analyticsError);
    }

    // Emit real-time notification via WebSocket
    const webSocketService = (global as any).webSocketService;
    if (webSocketService) {
      webSocketService.emitToPublic('report:new', {
        id: report._id,
        title: report.title,
        category: report.category,
        location: report.location,
        urgencyLevel: report.urgencyLevel,
        isAnonymous: report.isAnonymous,
        timestamp: report.createdAt
      });

      // Emit to location-specific room
      if (report.location?.city && report.location?.state) {
        webSocketService.emitLocationUpdate(
          report.location.city,
          report.location.state,
          {
            type: 'new_report',
            reportId: report._id,
            category: report.category,
            urgencyLevel: report.urgencyLevel
          }
        );
      }
    }

    res.status(201).json({
      success: true,
      data: {
        report: {
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          priority: report.priority,
          urgencyLevel: report.urgencyLevel,
          incidentDate: report.incidentDate,
          location: report.location,
          isAnonymous: report.isAnonymous,
          isDraft: report.isDraft,
          departmentInvolved: report.departmentInvolved,
          monetaryValue: report.monetaryValue,
          witnesses: report.witnesses,
          contactInfo: report.contactInfo,
          evidence: report.evidence,
          trackingId: report._id.toString().slice(-8).toUpperCase(),
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          canEdit: true,
          canDelete: report.status === 'pending' || report.status === 'draft'
        }
      },
      message: report.isDraft ? 'Report saved as draft' : 'Report submitted successfully'
    });

  } catch (error) {
    logger.error('Error creating report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error creating report'
    });
  }
};

// Get reports with filtering and pagination
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      startDate,
      endDate,
      city,
      state
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    // User role-based filtering
    if (req.user?.role === 'citizen') {
      // Citizens can only see their own reports and public reports
      filter.$or = [
        { reporterId: req.user._id },
        { publicVisibility: true }
      ];
    } else if (req.user?.role === 'police') {
      // Police can see assigned reports and public reports
      filter.$or = [
        { assignedTo: req.user._id },
        { publicVisibility: true }
      ];
    }
    // Admins can see all reports (no additional filter)

    // Apply additional filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (city) filter['location.city'] = new RegExp(city as string, 'i');
    if (state) filter['location.state'] = new RegExp(state as string, 'i');

    // Date range filter
    if (startDate || endDate) {
      filter.incidentDate = {};
      if (startDate) filter.incidentDate.$gte = new Date(startDate as string);
      if (endDate) filter.incidentDate.$lte = new Date(endDate as string);
    }

    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Execute query
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter)
    ]);

    console.log('🔍 DEBUGGING: Transforming reports for response');

    res.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          priority: report.priority,
          incidentDate: report.incidentDate,
          location: report.location,
          isAnonymous: report.isAnonymous,
          reporter: report.isAnonymous ? null : report.reporterId,
          assignedTo: report.assignedTo,
          evidence: report.evidence || [], // Include evidence for media display
          viewCount: report.viewCount,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching reports', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

// Get user's own reports
export const getReportsByUser = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const [reports, total] = await Promise.all([
      Report.find({ reporterId: req.user._id })
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments({ reporterId: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          priority: report.priority,
          incidentDate: report.incidentDate,
          location: report.location,
          assignedTo: report.assignedTo,
          evidence: report.evidence,
          statusHistory: report.statusHistory,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching user reports', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?._id
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

// Get a specific report
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id)
      .populate('reporterId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('investigationNotes.addedBy', 'firstName lastName')
      .populate('messages.sender', 'firstName lastName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can view this report
    if (!report.canBeViewedBy(req.user!._id, req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    await report.incrementViewCount();

    res.json({
      success: true,
      data: {
        report: {
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          priority: report.priority,
          incidentDate: report.incidentDate,
          location: report.location,
          isAnonymous: report.isAnonymous,
          reporter: report.isAnonymous ? null : report.reporterId,
          assignedTo: report.assignedTo,
          involvedParties: report.involvedParties,
          evidence: report.evidence,
          investigationNotes: report.investigationNotes,
          statusHistory: report.statusHistory,
          messages: report.messages,
          viewCount: report.viewCount,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching report'
    });
  }
};

// Enhanced update report with validation and permissions
export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Enhanced permission checking
    const isOwner = report.reporterId?.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';
    const isPolice = req.userRole === 'police';

    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'User role not found'
      });
    }

    // Citizens can only edit their own reports if status is pending or under_review
    if (req.userRole === 'citizen') {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own reports'
        });
      }

      if (!['pending', 'under_review'].includes(report.status)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit report after investigation has started'
        });
      }
    }

    // Police and admins have broader edit permissions
    if (!isOwner && !isAdmin && !isPolice) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Define allowed fields based on user role
    let allowedFields: string[] = [];

    if (req.userRole === 'citizen' && isOwner) {
      allowedFields = ['title', 'description', 'category', 'location', 'urgencyLevel', 'priority'];
    } else if (req.userRole === 'police') {
      allowedFields = ['priority', 'assignedTo', 'investigationNotes'];
    } else if (req.userRole === 'admin') {
      allowedFields = ['title', 'description', 'category', 'location', 'priority', 'assignedTo', 'status'];
    }

    // Apply updates only to allowed fields
    const updates: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Handle file uploads if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newEvidence = req.files.map((file: any) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
        uploadedBy: req.userId
      }));

      updates.evidence = [...(report.evidence || []), ...newEvidence];
    }

    // Update the report
    Object.assign(report, updates);
    report.lastUpdatedBy = new Types.ObjectId(req.userId!);
    report.updatedAt = new Date();

    await report.save();

    // Emit real-time update
    const webSocketService = (global as any).webSocketService;
    if (webSocketService) {
      webSocketService.emitToUser(report.reporterId?.toString(), 'report:updated', {
        reportId: report._id,
        updates: Object.keys(updates),
        updatedBy: req.userRole,
        timestamp: new Date()
      });

      // Notify assigned investigator if exists
      if (report.assignedTo) {
        webSocketService.emitToUser(report.assignedTo.toString(), 'report:updated', {
          reportId: report._id,
          updates: Object.keys(updates),
          updatedBy: req.userRole,
          timestamp: new Date()
        });
      }
    }

    // Trigger analytics update
    try {
      await analyticsService.broadcastAnalyticsUpdate('report:updated', {
        reportId: report._id,
        category: report.category,
        status: report.status,
        updatedBy: req.userRole
      });
    } catch (analyticsError) {
      logger.warn('Failed to broadcast analytics update:', analyticsError);
    }

    logger.info('Report updated successfully', {
      reportId: report._id,
      updatedBy: req.userId,
      userRole: req.userRole,
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      data: {
        report: {
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          priority: report.priority,
          urgencyLevel: report.urgencyLevel,
          location: report.location,
          evidence: report.evidence,
          updatedAt: report.updatedAt,
          canEdit: req.userRole === 'citizen' ?
            isOwner && ['pending', 'under_review'].includes(report.status) :
            req.userRole ? ['admin', 'police'].includes(req.userRole) : false,
          canDelete: req.userRole === 'citizen' ?
            isOwner && report.status === 'pending' :
            req.userRole === 'admin'
        }
      },
      message: 'Report updated successfully'
    });

  } catch (error) {
    logger.error('Error updating report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      message: 'Error updating report'
    });
  }
};

// Enhanced delete report with strict permissions and audit logging
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Enhanced permission checking
    const isOwner = report.reporterId?.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    // Citizens can only delete their own reports if status is pending
    if (req.userRole === 'citizen') {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reports'
        });
      }

      if (report.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete report after investigation has started'
        });
      }
    }

    // Only admins can delete reports in other statuses
    if (!isAdmin && report.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete reports under investigation'
      });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Store report data for audit log before deletion
    const reportData = {
      id: report._id,
      title: report.title,
      category: report.category,
      status: report.status,
      reporterId: report.reporterId,
      createdAt: report.createdAt
    };

    // Delete associated files if any
    if (report.evidence && report.evidence.length > 0) {
      // TODO: Implement file cleanup from storage
      logger.info('Files to be cleaned up:', {
        reportId: report._id,
        fileCount: report.evidence.length
      });
    }

    await Report.findByIdAndDelete(id);

    // Emit real-time update
    const webSocketService = (global as any).webSocketService;
    if (webSocketService) {
      // Notify the report owner if deleted by admin
      if (!isOwner && report.reporterId) {
        webSocketService.emitToUser(report.reporterId.toString(), 'report:deleted', {
          reportId: report._id,
          title: report.title,
          deletedBy: req.userRole,
          timestamp: new Date(),
          reason: 'Administrative action'
        });
      }

      // Notify assigned investigator if exists
      if (report.assignedTo) {
        webSocketService.emitToUser(report.assignedTo.toString(), 'report:deleted', {
          reportId: report._id,
          title: report.title,
          deletedBy: req.userRole,
          timestamp: new Date()
        });
      }

      // Broadcast to public channels for analytics
      webSocketService.emitToPublic('report:deleted', {
        category: report.category,
        status: report.status,
        timestamp: new Date()
      });
    }

    // Trigger analytics update
    try {
      await analyticsService.broadcastAnalyticsUpdate('report:deleted', {
        reportId: report._id,
        category: report.category,
        status: report.status,
        deletedBy: req.userRole
      });
    } catch (analyticsError) {
      logger.warn('Failed to broadcast analytics update:', analyticsError);
    }

    // Comprehensive audit logging
    logger.info('Report deleted successfully', {
      reportId: report._id,
      reportTitle: report.title,
      reportCategory: report.category,
      reportStatus: report.status,
      deletedBy: req.userId,
      userRole: req.userRole,
      isOwner,
      timestamp: new Date(),
      reportData
    });

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: {
        deletedReportId: id,
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('Error deleting report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id,
      userId: req.userId,
      userRole: req.userRole
    });

    res.status(500).json({
      success: false,
      message: 'Error deleting report'
    });
  }
};

// Update report status (Admin/Police only)
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.addStatusUpdate(status, req.user!._id, reason, notes);

    res.json({
      success: true,
      data: {
        report: {
          id: report._id.toString(),
          status: report.status,
          statusHistory: report.statusHistory
        }
      },
      message: 'Report status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating report status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error updating report status'
    });
  }
};

// Assign report to investigator
export const assignReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(assigneeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.assignedTo = new Types.ObjectId(assigneeId);
    report.lastUpdatedBy = req.user!._id;
    await report.save();

    // Add status update
    await report.addStatusUpdate(
      'under_investigation',
      req.user!._id,
      'Report assigned to investigator',
      `Assigned to investigator`
    );

    res.json({
      success: true,
      message: 'Report assigned successfully'
    });

  } catch (error) {
    logger.error('Error assigning report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error assigning report'
    });
  }
};

// Add investigation note
export const addReportNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, isPublic = false } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.addInvestigationNote(note, req.user!._id, isPublic);

    res.json({
      success: true,
      message: 'Investigation note added successfully'
    });

  } catch (error) {
    logger.error('Error adding investigation note', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error adding investigation note'
    });
  }
};
