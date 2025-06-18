import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param } from 'express-validator';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

// Input sanitization helpers
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limit length
};

// File validation helpers
export const validateFileType = (mimetype: string): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  return allowedTypes.includes(mimetype);
};

export const validateFileSize = (size: number): boolean => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  return size <= maxSize;
};

// Report validation rules
export const validateReportInput = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeInput),
    
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters')
    .customSanitizer(sanitizeInput),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'])
    .withMessage('Invalid category'),
    
  body('incidentDate')
    .notEmpty()
    .withMessage('Incident date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const incidentDate = new Date(value);
      const now = new Date();
      if (incidentDate > now) {
        throw new Error('Incident date cannot be in the future');
      }
      return true;
    }),
    
  body('location.address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters')
    .customSanitizer(sanitizeInput),
    
  body('location.city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .customSanitizer(sanitizeInput),
    
  body('location.state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .customSanitizer(sanitizeInput),
    
  body('location.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters')
    .customSanitizer(sanitizeInput),
    
  body('urgencyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Urgency level must be between 1 and 10'),
    
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous flag must be boolean'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
];

// Report update validation (more lenient)
export const validateReportUpdate = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeInput),
    
  body('description')
    .optional()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters')
    .customSanitizer(sanitizeInput),
    
  body('category')
    .optional()
    .isIn(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'])
    .withMessage('Invalid category'),
    
  body('urgencyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Urgency level must be between 1 and 10'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
];

// ID validation
export const validateReportId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID format')
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));
    
    logger.warn('Validation errors:', { 
      errors: errorMessages,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// File upload validation middleware
export const validateFileUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return next(); // No files uploaded, continue
    }

    // Handle different file upload formats
    let files: Express.Multer.File[] = [];

    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      // Handle named fields (req.files is an object with field names as keys)
      files = Object.values(req.files).flat();
    }

    const maxFiles = 5;

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed`
      });
    }

    for (const file of files) {
      // Ensure file is a proper Multer file object
      if (!file || typeof file !== 'object' || !file.mimetype || !file.size) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format'
        });
      }

      // Validate file type
      if (!validateFileType(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type: ${file.mimetype}. Allowed types: images, PDFs, videos, documents`
        });
      }

      // Validate file size
      if (!validateFileSize(file.size)) {
        return res.status(400).json({
          success: false,
          message: `File too large: ${file.originalname || 'unknown'}. Maximum size: 50MB`
        });
      }

      // Validate filename
      if (file.originalname && file.originalname.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Filename too long'
        });
      }
    }
    
    logger.info('File upload validation passed:', {
      userId: req.userId,
      fileCount: files.length,
      files: files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype }))
    });
    
    next();
  } catch (error) {
    logger.error('File validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'File validation failed'
    });
  }
};

// Rate limiting validation
export const validateRateLimit = (req: AuthRequest, res: Response, next: NextFunction) => {
  // This would integrate with a rate limiting service like Redis
  // For now, we'll implement a simple in-memory rate limiter
  
  const userId = req.userId;
  if (!userId) {
    return next();
  }
  
  // TODO: Implement proper rate limiting with Redis
  // For now, just log the attempt
  logger.info('Rate limit check:', {
    userId,
    ip: req.ip,
    endpoint: req.path,
    method: req.method
  });
  
  next();
};

// Security headers middleware
export const addSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response
      logger.info('Audit log:', {
        action,
        userId: req.userId,
        userRole: req.userRole,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        reportId: req.params.id || 'N/A'
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
