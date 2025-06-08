import { Request, Response } from 'express';
import Report, { IReport } from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Report creation request received', {
      body: req.body,
      files: req.files ? (req.files as any[]).map(f => ({ filename: f.filename, mimetype: f.mimetype, size: f.size })) : [],
      isAnonymous: req.body.isAnonymous,
      user: req.user ? req.user._id : 'anonymous'
    });

    const {
      title,
      description,
      category,
      incidentDate,
      incidentTime,
      location,
      isAnonymous = false,
      involvedParties = [],
      estimatedLoss,
      currency = 'INR',
      urgencyLevel = 5,
      tags = []
    } = req.body;

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
      return res.status(400).json({
        success: false,
        message: 'Location with address, city, and state is required'
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

    // Combine date and time
    let fullIncidentDate = new Date(incidentDate);
    if (incidentTime) {
      const [hours, minutes] = incidentTime.split(':');
      fullIncidentDate.setHours(parseInt(hours), parseInt(minutes));
    }

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

    // Create report data
    const reportData: Partial<IReport> = {
      title,
      description,
      category,
      incidentDate: fullIncidentDate,
      location: parsedLocation,
      isAnonymous,
      involvedParties: parsedInvolvedParties,
      evidence,
      estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : undefined,
      currency,
      urgencyLevel: parseInt(urgencyLevel) || 5,
      tags: parsedTags,
      status: 'pending',
      priority: 'medium',
      publicVisibility: false,
      viewCount: 0
    };

    // Set reporter if not anonymous
    if (!isAnonymous && req.user) {
      reportData.reporterId = req.user._id;
    }

    // Create the report
    const report = new Report(reportData);
    await report.save();

    // Populate reporter information for response
    await report.populate('reporterId', 'firstName lastName email');

    logger.info('Report created successfully', {
      reportId: report._id,
      category: report.category,
      isAnonymous: report.isAnonymous,
      reporterId: report.reporterId
    });

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
          incidentDate: report.incidentDate,
          location: report.location,
          isAnonymous: report.isAnonymous,
          evidence: report.evidence,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        }
      },
      message: 'Report submitted successfully'
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

// Update a report
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

    // Check permissions
    const isOwner = report.reporterId?.equals(req.user!._id);
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'category', 'location', 'involvedParties'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        (report as any)[field] = updateData[field];
      }
    });

    report.lastUpdatedBy = req.user!._id;
    await report.save();

    res.json({
      success: true,
      data: {
        report: {
          id: report._id.toString(),
          title: report.title,
          description: report.description,
          category: report.category,
          status: report.status,
          updatedAt: report.updatedAt
        }
      },
      message: 'Report updated successfully'
    });

  } catch (error) {
    logger.error('Error updating report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error updating report'
    });
  }
};

// Delete a report
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

    // Check permissions
    const isOwner = report.reporterId?.equals(req.user!._id);
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Report.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportId: req.params.id
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
