const request = require('supertest');
const app = require('../server');

describe('HealthBridge API Tests', () => {
  let authToken;
  let userId;

  // Test Health Check
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('HealthBridge AI Backend');
    });
  });

  // Test Authentication
  describe('Authentication API', () => {
    describe('POST /api/auth/send-otp', () => {
      it('should send OTP successfully', async () => {
        const res = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone: '+91-9876543210' })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('OTP sent successfully');
      });

      it('should fail with invalid phone number', async () => {
        const res = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone: 'invalid' })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with correct OTP', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ 
            phone: '+91-9876543210',
            otp: '123456'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
        
        authToken = res.body.token;
        userId = res.body.user.id;
      });

      it('should fail with incorrect OTP', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ 
            phone: '+91-9876543210',
            otp: '000000'
          })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const res = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.user.id).toBe(userId);
      });

      it('should fail without token', async () => {
        const res = await request(app)
          .get('/api/auth/profile')
          .expect(401);
        
        expect(res.body.success).toBe(false);
      });
    });
  });

  // Test Symptoms API
  describe('Symptoms API', () => {
    describe('POST /api/symptoms/analyze', () => {
      it('should analyze symptoms successfully', async () => {
        const res = await request(app)
          .post('/api/symptoms/analyze')
          .send({
            symptoms: ['fever', 'headache'],
            inputType: 'text',
            language: 'en',
            patientAge: 30,
            patientGender: 'male'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.analysis).toBeDefined();
        expect(res.body.analysis.riskLevel).toMatch(/green|amber|red/);
        expect(res.body.analysis.riskScore).toBeGreaterThanOrEqual(0);
        expect(res.body.analysis.riskScore).toBeLessThanOrEqual(100);
      });

      it('should handle empty symptoms', async () => {
        const res = await request(app)
          .post('/api/symptoms/analyze')
          .send({
            symptoms: [],
            inputType: 'text'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.analysis.riskLevel).toBe('green');
      });

      it('should handle high-risk symptoms', async () => {
        const res = await request(app)
          .post('/api/symptoms/analyze')
          .send({
            symptoms: ['chest_pain', 'difficulty_breathing'],
            inputType: 'text',
            patientAge: 65
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.analysis.riskLevel).toBe('red');
        expect(res.body.analysis.urgency).toBe('immediate');
      });
    });
  });

  // Test Triage API
  describe('Triage API', () => {
    describe('POST /api/triage/decide', () => {
      it('should make triage decision', async () => {
        const res = await request(app)
          .post('/api/triage/decide')
          .send({
            symptoms: ['fever', 'cough'],
            riskScore: 60,
            patientAge: 45,
            patientGender: 'female',
            medicalHistory: ['diabetes']
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.decision).toBeDefined();
        expect(res.body.decision.action).toMatch(/home_care|asha_visit|phc_referral|emergency/);
        expect(res.body.decision.priority).toMatch(/low|medium|high|critical/);
      });
    });

    describe('GET /api/triage/stats', () => {
      it('should return triage statistics', async () => {
        const res = await request(app)
          .get('/api/triage/stats')
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.stats).toBeDefined();
        expect(res.body.stats.totalCases).toBeGreaterThan(0);
      });
    });
  });

  // Test Resources API
  describe('Resources API', () => {
    describe('POST /api/resources/find', () => {
      it('should find nearby resources', async () => {
        const res = await request(app)
          .post('/api/resources/find')
          .send({
            userLocation: { lat: 28.6139, lng: 77.2090 },
            resourceType: 'all',
            maxDistance: 10
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.resources).toBeDefined();
        expect(Array.isArray(res.body.resources)).toBe(true);
      });
    });

    describe('POST /api/resources/emergency/ambulance', () => {
      it('should request ambulance', async () => {
        const res = await request(app)
          .post('/api/resources/emergency/ambulance')
          .send({
            userLocation: { lat: 28.6139, lng: 77.2090 },
            patientInfo: { name: 'Test Patient', age: 30 },
            emergencyType: 'cardiac',
            contactNumber: '+91-9876543210'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.ambulance).toBeDefined();
        expect(res.body.ambulance.requestId).toBeDefined();
      });
    });
  });

  // Test ASHA API (requires authentication)
  describe('ASHA API', () => {
    describe('GET /api/asha/dashboard', () => {
      it('should get ASHA dashboard with auth', async () => {
        const res = await request(app)
          .get('/api/asha/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.dashboard).toBeDefined();
      });

      it('should fail without auth', async () => {
        const res = await request(app)
          .get('/api/asha/dashboard')
          .expect(401);
        
        expect(res.body.success).toBe(false);
      });
    });
  });

  // Test Teleconsult API
  describe('Teleconsult API', () => {
    describe('GET /api/teleconsult/doctors', () => {
      it('should get available doctors', async () => {
        const res = await request(app)
          .get('/api/teleconsult/doctors')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.doctors).toBeDefined();
        expect(Array.isArray(res.body.doctors)).toBe(true);
      });
    });

    describe('POST /api/teleconsult/book', () => {
      it('should book teleconsultation', async () => {
        const res = await request(app)
          .post('/api/teleconsult/book')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            doctorId: 'doc_001',
            patientInfo: { name: 'Test Patient', age: 30 },
            symptoms: ['fever', 'cough'],
            preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            urgency: 'normal'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.consultation).toBeDefined();
        expect(res.body.consultation.id).toBeDefined();
      });
    });
  });
});

// AI Engine Tests
describe('AI Engine Integration Tests', () => {
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';

  describe('GET /health', () => {
    it('should return AI engine health status', async () => {
      const res = await request(AI_ENGINE_URL)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('HealthBridge AI Engine');
    });
  });

  describe('POST /analyze', () => {
    it('should analyze symptoms with AI', async () => {
      const res = await request(AI_ENGINE_URL)
        .post('/analyze')
        .send({
          symptoms: ['fever', 'headache', 'cough'],
          inputType: 'text',
          language: 'en',
          patientAge: 35,
          patientGender: 'female'
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.riskLevel).toMatch(/green|amber|red/);
      expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(res.body.riskScore).toBeLessThanOrEqual(100);
      expect(res.body.explanation).toBeDefined();
      expect(res.body.recommendations).toBeDefined();
    });
  });

  describe('POST /voice-to-text', () => {
    it('should process voice input', async () => {
      const res = await request(AI_ENGINE_URL)
        .post('/voice-to-text')
        .field('language', 'hi')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.text).toBeDefined();
    });
  });

  describe('GET /models/status', () => {
    it('should return model status', async () => {
      const res = await request(AI_ENGINE_URL)
        .get('/models/status')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.models).toBeDefined();
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  it('should handle multiple concurrent symptom analyses', async () => {
    const promises = [];
    const numRequests = 10;
    
    for (let i = 0; i < numRequests; i++) {
      promises.push(
        request(app)
          .post('/api/symptoms/analyze')
          .send({
            symptoms: ['fever', 'headache'],
            inputType: 'text',
            patientAge: 30 + i
          })
      );
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  it('should respond to health check within 100ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});

// Error Handling Tests
describe('Error Handling', () => {
  it('should handle malformed JSON', async () => {
    const res = await request(app)
      .post('/api/symptoms/analyze')
      .send('invalid json')
      .expect(400);
    
    expect(res.body.success).toBe(false);
  });

  it('should handle missing required fields', async () => {
    const res = await request(app)
      .post('/api/symptoms/analyze')
      .send({})
      .expect(200); // Should still work with defaults
    
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    expect(res.body.error).toBe('Route not found');
  });
});

module.exports = {
  // Export for use in other test files
  getAuthToken: () => authToken,
  getUserId: () => userId
};