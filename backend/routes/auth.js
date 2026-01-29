const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpService = require('../services/otpService');
const logger = require('../utils/logger');

// Simple validation helper
const validateInput = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        errors.push(`${field} is required`);
      }
    }
    
    // Phone validation
    if (requiredFields.includes('phone') && req.body.phone) {
      // Remove country code and special characters
      const cleanPhone = req.body.phone.replace(/[\+\-\s]/g, '');
      const phoneRegex = /^(?:91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Please provide a valid Indian phone number');
      } else {
        // Normalize phone number to 10 digits
        req.body.phone = cleanPhone.length === 12 ? cleanPhone.slice(2) : cleanPhone;
      }
    }
    
    // OTP validation
    if (requiredFields.includes('otp') && req.body.otp) {
      if (!/^\d{6}$/.test(req.body.otp)) {
        errors.push('OTP must be 6 digits');
      }
    }
    
    // Name validation
    if (requiredFields.includes('name') && req.body.name) {
      if (req.body.name.length < 2 || req.body.name.length > 100) {
        errors.push('Name must be between 2 and 100 characters');
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

// Send OTP
router.post('/send-otp', validateInput(['phone']), async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate and store OTP
    const otp = otpService.generateOTP();
    await otpService.storeOTP(phone, otp);

    // Send OTP via SMS
    const sendResult = await otpService.sendOTP(phone, otp);
    
    if (!sendResult.success) {
      logger.error('Failed to send OTP', { phone: otpService.maskPhone(phone) });
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }

    logger.info('OTP sent successfully', { phone: otpService.maskPhone(phone) });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    logger.error('OTP sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Register user
router.post('/register', validateInput(['phone', 'name', 'otp']), async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      otp,
      userType = 'citizen',
      language = 'hi',
      location,
      abhaId = null 
    } = req.body;

    // Verify OTP first
    const otpResult = await otpService.verifyOTP(phone, otp);
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        error: otpResult.error
      });
    }

    // Check if user already exists
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const userData = {
      phone,
      name,
      userType,
      language,
      location,
      abhaId,
      isVerified: true // Since OTP was verified
    };

    const user = await User.create(userData);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone, userType: user.user_type },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('User registered successfully', { userId: user.id, phone: otpService.maskPhone(phone) });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        userType: user.user_type,
        language: user.language
      },
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', validateInput(['phone', 'otp']), async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Verify OTP
    const otpResult = await otpService.verifyOTP(phone, otp);
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        error: otpResult.error
      });
    }

    // Find user
    let user = await User.findByPhone(phone);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.'
      });
    }

    // Update verification status if not already verified
    if (!user.is_verified) {
      await User.update(user.id, { is_verified: true });
      user.is_verified = true;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone, userType: user.user_type },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('User logged in successfully', { userId: user.id, phone: otpService.maskPhone(phone) });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        userType: user.user_type,
        language: user.language
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        userType: user.user_type,
        language: user.language,
        location: user.location,
        abhaId: user.abha_id,
        isVerified: user.is_verified,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, validateInput(['name']), async (req, res) => {
  try {
    const { name, language, location, abhaId } = req.body;
    
    const updateData = { name };
    if (language) updateData.language = language;
    if (location) updateData.location = location;
    if (abhaId) updateData.abha_id = abhaId;

    const updatedUser = await User.update(req.user.userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('User profile updated', { userId: req.user.userId });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        userType: updatedUser.user_type,
        language: updatedUser.language,
        location: updatedUser.location,
        abhaId: updatedUser.abha_id
      }
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;