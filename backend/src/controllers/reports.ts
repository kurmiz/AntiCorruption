import { Request, Response } from 'express';
import Report, { IReport } from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
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

    // Parse location if it's a string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location format'
        });
      }
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
    const evidence = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        evidence.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'document',
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
