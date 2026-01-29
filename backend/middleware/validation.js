const { body, param, query, validationResult } = require('express-validator');

// Common validation rules
const phoneValidation = body('phone')
  .isMobilePhone('en-IN')
  .withMessage('Please provide a valid Indian phone number');

const otpValidation = body('otp')
  .isLength({ min: 6, max: 6 })
  .isNumeric()
  .withMessage('OTP must be 6 digits');

const nameValidation = body('name')
  .isLength({ min: 2, max: 100 })
  .trim()
  .escape()
  .withMessage('Name must be between 2 and 100 characters');

const userTypeValidation = body('userType')
  .optional()
  .isIn(['citizen', 'asha', 'phc_staff', 'doctor'])
  .withMessage('Invalid user type');

const languageValidation = body('language')
  .optional()
  .isIn(['hi', 'en', 'ta', 'te', 'bn', 'gu', 'mr'])
  .withMessage('Unsupported language');

// Symptom analysis validation
const symptomsValidation = body('symptoms')
  .isArray({ min: 0, max: 20 })
  .withMessage('Symptoms must be an array with maximum 20 items');

const inputTypeValidation = body('inputType')
  .optional()
  .isIn(['text', 'voice', 'image'])
  .withMessage('Invalid input type');

const ageValidation = body('patientAge')
  .optional()
  .isInt({ min: 0, max: 120 })
  .withMessage('Age must be between 0 and 120');

const genderValidation = body('patientGender')
  .optional()
  .isIn(['male', 'female', 'other', 'unknown'])
  .withMessage('Invalid gender');

// Location validation
const locationValidation = body('userLocation')
  .optional()
  .custom((value) => {
    if (value && (!value.lat || !value.lng)) {
      throw new Error('Location must include lat and lng coordinates');
    }
    if (value && (Math.abs(value.lat) > 90 || Math.abs(value.lng) > 180)) {
      throw new Error('Invalid coordinates');
    }
    return true;
  });

// Resource type validation
const resourceTypeValidation = body('resourceType')
  .optional()
  .isIn(['phc', 'chc', 'asha', 'hospital', 'all'])
  .withMessage('Invalid resource type');

// Urgency validation
const urgencyValidation = body('urgency')
  .optional()
  .isIn(['low', 'medium', 'high', 'emergency'])
  .withMessage('Invalid urgency level');

// UUID validation
const uuidValidation = param('id')
  .isUUID()
  .withMessage('Invalid ID format');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Rate limiting validation
const rateLimitValidation = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip + req.user?.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [k, timestamps] of requests.entries()) {
      requests.set(k, timestamps.filter(t => t > windowStart));
      if (requests.get(k).length === 0) {
        requests.delete(k);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

// Validation rule sets
const validationRules = {
  // Auth validations
  register: [
    phoneValidation,
    nameValidation,
    userTypeValidation,
    languageValidation,
    validate
  ],
  
  login: [
    phoneValidation,
    otpValidation,
    validate
  ],
  
  sendOTP: [
    phoneValidation,
    validate
  ],
  
  // Symptom analysis validations
  analyzeSymptoms: [
    symptomsValidation,
    inputTypeValidation,
    languageValidation,
    ageValidation,
    genderValidation,
    validate
  ],
  
  // Resource finding validations
  findResources: [
    locationValidation,
    resourceTypeValidation,
    urgencyValidation,
    validate
  ],
  
  // Triage validations
  triageDecision: [
    symptomsValidation,
    body('riskScore').isInt({ min: 0, max: 100 }),
    ageValidation,
    genderValidation,
    validate
  ],
  
  // Teleconsult validations
  bookConsultation: [
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('patientInfo').isObject().withMessage('Patient info is required'),
    body('symptoms').isArray().withMessage('Symptoms must be an array'),
    urgencyValidation,
    validate
  ],
  
  // ASHA validations
  recordVisit: [
    body('patientId').isUUID().withMessage('Invalid patient ID'),
    body('visitType').isIn(['routine', 'follow_up', 'emergency']),
    body('symptoms').optional().isArray(),
    body('treatment').optional().isString(),
    validate
  ],
  
  // Generic UUID validation
  validateUUID: [
    uuidValidation,
    validate
  ]
};

module.exports = {
  validate,
  sanitizeInput,
  rateLimitValidation,
  validationRules,
  
  // Individual validators for custom use
  phoneValidation,
  otpValidation,
  nameValidation,
  userTypeValidation,
  languageValidation,
  symptomsValidation,
  inputTypeValidation,
  ageValidation,
  genderValidation,
  locationValidation,
  resourceTypeValidation,
  urgencyValidation,
  uuidValidation
};