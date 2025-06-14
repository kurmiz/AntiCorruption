import express from 'express';
import { body } from 'express-validator';
import { signup, login, getMe, updateProfile, updatePreferences, updatePassword } from '../controllers/auth';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

// Validation middleware
const signupValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  // Support both old format (name) and new format (firstName, lastName)
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('role')
    .optional()
    .isIn(['citizen', 'police', 'admin'])
    .withMessage('Invalid role'),
];

const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters long'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a valid string'),
];

const preferencesUpdateValidation = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  body('language')
    .optional()
    .matches(/^[a-z]{2}$/)
    .withMessage('Language must be a valid 2-letter code'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('profileVisibility')
    .optional()
    .isIn(['public', 'private', 'contacts'])
    .withMessage('Profile visibility must be public, private, or contacts'),
  body('defaultDashboard')
    .optional()
    .isString()
    .withMessage('Default dashboard must be a valid string'),
];

const passwordUpdateValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isLength({ min: 1 })
    .withMessage('Current password cannot be empty'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Routes
router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe); // Alias for /me
router.put('/profile', protect, profileUpdateValidation, validate, updateProfile);
router.put('/preferences', protect, preferencesUpdateValidation, validate, updatePreferences);
router.put('/password', protect, passwordUpdateValidation, validate, updatePassword);

export default router;
