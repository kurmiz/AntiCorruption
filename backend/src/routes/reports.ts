import express from 'express';
import { body, query } from 'express-validator';
import {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  updateReportStatus,
  assignReport,
  addReportNote,
  getReportsByUser
} from '../controllers/reports';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
// Remove unused validation imports since we're using the original validation
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Validation middleware
const createReportValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('category')
    .isIn(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'])
    .withMessage('Invalid category'),
  body('incidentDate')
    .isISO8601()
    .withMessage('Invalid incident date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Incident date cannot be in the future');
      }
      return true;
    }),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('location.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

const updateReportValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('category')
    .optional()
    .isIn(['bribery', 'fraud', 'embezzlement', 'abuse_of_power', 'nepotism', 'other'])
    .withMessage('Invalid category'),
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'under_investigation', 'resolved', 'rejected', 'closed'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
];

const assignReportValidation = [
  body('assigneeId')
    .isMongoId()
    .withMessage('Invalid assignee ID'),
];

const addNoteValidation = [
  body('note')
    .trim()
    .notEmpty()
    .withMessage('Note is required')
    .isLength({ max: 1000 })
    .withMessage('Note must be less than 1000 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

// Routes

// Public routes (for anonymous reports)
router.post('/anonymous',
  upload.array('media', 5),
  createReportValidation,
  validate,
  createReport
);

// Public route to get reports (for dashboard display)
router.get('/public', getReports);

// Protected routes (require authentication)
router.use(protect);

// Create report (authenticated users)
router.post('/',
  upload.array('media', 5),
  createReportValidation,
  validate,
  createReport
);

// Get reports with filtering and pagination
router.get('/', getReports);

// Get user's own reports
router.get('/my-reports', getReportsByUser);

// Get specific report
router.get('/:id', getReport);

// Update report (only by reporter or admin/police)
router.put('/:id',
  upload.array('media', 5),
  updateReportValidation,
  validate,
  updateReport
);

// Delete report (only by reporter or admin)
router.delete('/:id', deleteReport);

// Admin/Police only routes
router.use(authorize('admin', 'police'));

// Update report status
router.put('/:id/status',
  statusUpdateValidation,
  validate,
  updateReportStatus
);

// Assign report to investigator
router.post('/:id/assign',
  assignReportValidation,
  validate,
  assignReport
);

// Add investigation note
router.post('/:id/notes',
  addNoteValidation,
  validate,
  addReportNote
);

export default router;
