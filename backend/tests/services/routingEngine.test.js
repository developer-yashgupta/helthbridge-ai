const RoutingEngine = require('../../services/routingEngine');

// Mock database module
jest.mock('../../config/database');
const { query } = require('../../config/database');

describe('RoutingEngine - Initialization and Configuration', () => {
  let routingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    routingEngine = new RoutingEngine();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with correct severity mapping', () => {
      expect(routingEngine.severityMapping).toBeDefined();
      expect(routingEngine.severityMapping.low).toEqual({ range: [0, 40], facility: 'ASHA' });
      expect(routingEngine.severityMapping.medium).toEqual({ range: [41, 60], facility: 'PHC' });
      expect(routingEngine.severityMapping.high).toEqual({ range: [61, 80], facility: 'CHC' });
      expect(routingEngine.severityMapping.critical).toEqual({ range: [81, 100], facility: 'EMERGENCY' });
    });

    test('should initialize with emergency keywords', () => {
      expect(routingEngine.emergencyKeywords).toBeDefined();
      expect(routingEngine.emergencyKeywords).toContain('chest pain');
      expect(routingEngine.emergencyKeywords).toContain('difficulty breathing');
      expect(routingEngine.emergencyKeywords).toContain('सीने में दर्द');
      expect(routingEngine.emergencyKeywords).toContain('सांस लेने में तकलीफ');
    });

    test('should initialize with risk factors', () => {
      expect(routingEngine.riskFactors).toBeDefined();
      expect(routingEngine.riskFactors.diabetes).toBe(5);
      expect(routingEngine.riskFactors.hypertension).toBe(5);
      expect(routingEngine.riskFactors.heart_disease).toBe(10);
      expect(routingEngine.riskFactors.cancer).toBe(15);
    });
  });
});

describe('RoutingEngine - Routing Decision Logic', () => {
  let routingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    routingEngine = new RoutingEngine();
    
    // Mock findNearestFacility to return a facility
    routingEngine.findNearestFacility = jest.fn().mockResolvedValue({
      id: 'facility-123',
      name: 'Test Facility',
      type: 'ASHA',
      contactInfo: { phone: '1234567890' },
      location: { lat: 12.9716, lng: 77.5946 },
      distanceKm: 2.5
    });
  });

  describe('determineRouting', () => {
    test('should route low severity to ASHA worker', async () => {
      const params = {
        symptoms: ['mild headache', 'slight fever'],
        severityScore: 30,
        location: { lat: 12.9716, lng: 77.5946 }
      };

      const result = await routingEngine.determineRouting(params);

      expect(result.severityLevel).toBe('low');
      expect(result.recommendedFacilityType).toBe('ASHA');
      expect(result.facility).toBeDefined();
      expect(routingEngine.findNearestFacility).toHaveBeenCalledWith('ASHA', params.location);
    });

    test('should route medium severity to PHC', async () => {
      const params = {
        symptoms: ['persistent fever', 'body ache'],
        severityScore: 50,
        location: { lat: 12.9716, lng: 77.5946 }
      };

      routingEngine.findNearestFacility.mockResolvedValue({
        id: 'phc-456',
        name: 'Primary Health Center',
        type: 'PHC',
        contactInfo: { phone: '9876543210' },
        location: { lat: 12.9800, lng: 77.6000 },
        distanceKm: 5.2
      });

      const result = await routingEngine.determineRouting(params);

      expect(result.severityLevel).toBe('medium');
      expect(result.recommendedFacilityType).toBe('PHC');
      expect(result.facility.type).toBe('PHC');
    });

    test('should route critical severity to emergency', async () => {
      const params = {
        symptoms: ['chest pain', 'difficulty breathing'],
        severityScore: 95,
        location: { lat: 12.9716, lng: 77.5946 }
      };

      routingEngine.findNearestFacility.mockResolvedValue({
        id: 'emergency-789',
        name: 'Emergency Hospital',
        type: 'EMERGENCY',
        contactInfo: { phone: '108' },
        location: { lat: 12.9900, lng: 77.6100 },
        distanceKm: 3.0
      });

      const result = await routingEngine.determineRouting(params);

      expect(result.severityLevel).toBe('critical');
      expect(result.recommendedFacilityType).toBe('EMERGENCY');
      expect(result.priority).toBe('immediate');
    });
  });
});
