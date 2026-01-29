const { query } = require('../config/database');

class OTPService {
  constructor() {
    this.otpStore = new Map(); // In production, use Redis
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Generate OTP
  generateOTP() {
    // Use fixed OTP for testing
    if (process.env.NODE_ENV === 'test') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiry
  async storeOTP(phone, otp) {
    const expiresAt = Date.now() + this.otpExpiry;
    
    // In production, store in Redis or database
    this.otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
      maxAttempts: 3
    });

    // Also log to database for analytics
    try {
      await query(
        'INSERT INTO analytics_events (event_type, event_data) VALUES ($1, $2)',
        ['otp_generated', JSON.stringify({ phone: this.maskPhone(phone) })]
      );
    } catch (error) {
      console.error('Failed to log OTP generation:', error);
    }

    return { otp, expiresAt };
  }

  // Verify OTP
  async verifyOTP(phone, providedOTP) {
    const otpData = this.otpStore.get(phone);
    
    if (!otpData) {
      return { success: false, error: 'OTP not found or expired' };
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(phone);
      return { success: false, error: 'OTP expired' };
    }

    // Check attempts
    if (otpData.attempts >= otpData.maxAttempts) {
      this.otpStore.delete(phone);
      return { success: false, error: 'Maximum attempts exceeded' };
    }

    // Verify OTP
    if (otpData.otp !== providedOTP) {
      otpData.attempts++;
      return { success: false, error: 'Invalid OTP' };
    }

    // Success - remove OTP
    this.otpStore.delete(phone);
    
    // Log successful verification
    try {
      await query(
        'INSERT INTO analytics_events (event_type, event_data) VALUES ($1, $2)',
        ['otp_verified', JSON.stringify({ phone: this.maskPhone(phone) })]
      );
    } catch (error) {
      console.error('Failed to log OTP verification:', error);
    }

    return { success: true };
  }

  // Clean expired OTPs
  cleanExpiredOTPs() {
    const now = Date.now();
    for (const [phone, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }

  // Mask phone number for logging
  maskPhone(phone) {
    if (!phone || phone.length < 4) return '****';
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  }

  // Send OTP via SMS (mock implementation)
  async sendOTP(phone, otp) {
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`Sending OTP ${otp} to ${this.maskPhone(phone)}`);
    
    // Mock delay to simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true, message: 'OTP sent successfully' };
  }

  // Get OTP status (for debugging/admin)
  getOTPStatus(phone) {
    const otpData = this.otpStore.get(phone);
    if (!otpData) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      isExpired: Date.now() > otpData.expiresAt
    };
  }
}

// Start cleanup interval
const otpService = new OTPService();
setInterval(() => {
  otpService.cleanExpiredOTPs();
}, 60000); // Clean every minute

module.exports = otpService;