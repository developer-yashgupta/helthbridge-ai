const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock user database
const mockUsers = new Map();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      userType = 'citizen', // 'citizen', 'asha', 'phc_staff'
      language = 'hi',
      location,
      abhaId = null 
    } = req.body;

    // Check if user exists
    if (mockUsers.has(phone)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const user = {
      id: `user_${Date.now()}`,
      phone,
      name,
      userType,
      language,
      location,
      abhaId,
      createdAt: new Date().toISOString(),
      isVerified: false
    };

    mockUsers.set(phone, user);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone, userType },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        userType: user.userType,
        language: user.language
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Mock OTP verification (in production, verify with SMS gateway)
    if (otp !== '123456') {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    let user = mockUsers.get(phone);
    
    if (!user) {
      // Auto-register for simplicity
      user = {
        id: `user_${Date.now()}`,
        phone,
        name: 'New User',
        userType: 'citizen',
        language: 'hi',
        createdAt: new Date().toISOString(),
        isVerified: true
      };
      mockUsers.set(phone, user);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone, userType: user.userType },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        userType: user.userType,
        language: user.language
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // Mock OTP sending (in production, integrate with SMS gateway)
    console.log(`Sending OTP to ${phone}: 123456`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    console.error('OTP sending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
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
router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = Array.from(mockUsers.values()).find(u => u.id === req.user.userId);
    
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
        userType: user.userType,
        language: user.language,
        location: user.location,
        abhaId: user.abhaId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;