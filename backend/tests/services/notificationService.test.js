const NotificationService = require('../../services/notificationService');

// Mock database module
jest.mock('../../config/database');
const { query } = require('../../config/database');

// Mock OTP service
jest.mock('../../services/otpService');

describe('NotificationService - Initialization and Configuration', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with correct priority mapping', () => {
      expect(notificationService.priorityMapping).toBeDefined();
      expect(notificationService.priorityMapping.low).toBe('low');
      expect(notificationService.priorityMapping.medium).toBe('medium');
      expect(notificationService.priorityMapping.high).toBe('high');
      expect(notificationService.priorityMapping.critical).toBe('critical');
    });

    test('should initialize with notification type mapping', () => {
      expect(notificationService.notificationTypeMapping).toBeDefined();
      expect(notificationService.notificationTypeMapping.low).toBe('new_referral');
      expect(notificationService.notificationTypeMapping.medium).toBe('new_referral');
      expect(notificationService.notificationTypeMapping.high).toBe('urgent_case');
      expect(notificationService.notificationTypeMapping.critical).toBe('emergency');
    });

    test('should initialize with worker type mapping', () => {
      expect(notificationService.workerTypeMapping).toBeDefined();
      expect(notificationService.workerTypeMapping.ASHA).toBe('asha');
      expect(notificationService.workerTypeMapping.PHC).toBe('phc_staff');
      expect(notificationService.workerTypeMapping.CHC).toBe('chc_staff');
      expect(notificationService.workerTypeMapping.EMERGENCY).toBe('emergency');
    });
  });
});

describe('NotificationService - Create Notification', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('createNotification', () => {
    test('should create notification with all required fields', async () => {
      const mockNotification = {
        id: 'notif-123',
        worker_id: 'worker-123',
        worker_type: 'asha',
        patient_id: 'patient-123',
        routing_decision_id: 'routing-123',
        notification_type: 'new_referral',
        priority: 'low',
        title: '📝 New consultation request',
        message: expect.any(String),
        patient_summary: expect.any(String),
        status: 'pending',
        sent_via: '["app"]',
        delivery_status: '{}',
        created_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockNotification] });

      const params = {
        workerId: 'worker-123',
        patientId: 'patient-123',
        routingDecisionId: 'routing-123',
        patientSummary: {
          name: 'John Doe',
          age: 35,
          gender: 'male',
          symptoms: ['headache', 'fever'],
          contact: '9876543210',
          location: { lat: 12.9716, lng: 77.5946 }
        },
        severity: 'low',
        facilityType: 'ASHA'
      };

      const result = await notificationService.createNotification(params);

      expect(result).toBeDefined();
      expect(result.id).toBe('notif-123');
      expect(query).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO worker_notifications'),
        expect.arrayContaining([
          'worker-123',
          'asha',
          'patient-123',
          'routing-123',
          'new_referral',
          'low'
        ])
      );
    });

    test('should determine correct priority for medium severity', async () => {
      query.mockResolvedValue({ 
        rows: [{ 
          id: 'notif-123', 
          priority: 'medium',
          worker_type: 'phc_staff'
        }] 
      });

      const params = {
        workerId: 'worker-123',
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['persistent cough'],
          age: 45
        },
        severity: 'medium',
        facilityType: 'PHC'
      };

      await notificationService.createNotification(params);

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['medium'])
      );
    });

    test('should determine correct priority for high severity', async () => {
      query.mockResolvedValue({ 
        rows: [{ 
          id: 'notif-123', 
          priority: 'high',
          notification_type: 'urgent_case'
        }] 
      });

      const params = {
        workerId: 'worker-123',
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['severe abdominal pain'],
          age: 50
        },
        severity: 'high',
        facilityType: 'CHC'
      };

      await notificationService.createNotification(params);

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['high', 'urgent_case'])
      );
    });

    test('should determine correct priority for critical severity', async () => {
      query.mockResolvedValue({ 
        rows: [{ 
          id: 'notif-123', 
          priority: 'critical',
          notification_type: 'emergency'
        }] 
      });

      const params = {
        workerId: 'worker-123',
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['chest pain', 'difficulty breathing'],
          age: 60
        },
        severity: 'critical',
        facilityType: 'EMERGENCY'
      };

      await notificationService.createNotification(params);

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['critical', 'emergency'])
      );
    });

    test('should throw error when required parameters are missing', async () => {
      const params = {
        workerId: 'worker-123',
        // Missing other required fields
      };

      await expect(notificationService.createNotification(params))
        .rejects
        .toThrow('Missing required parameters for notification creation');
    });

    test('should throw error when database query fails', async () => {
      query.mockRejectedValue(new Error('Database connection failed'));

      const params = {
        workerId: 'worker-123',
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['fever'],
          age: 30
        },
        severity: 'low',
        facilityType: 'ASHA'
      };

      await expect(notificationService.createNotification(params))
        .rejects
        .toThrow('Failed to create notification');
    });
  });

  describe('_formatPatientSummary', () => {
    test('should format patient summary with all fields', () => {
      const patientSummary = {
        name: 'Jane Doe',
        age: 28,
        gender: 'female',
        symptoms: ['headache', 'nausea'],
        contact: '9876543210',
        location: { lat: 12.9716, lng: 77.5946 },
        medicalHistory: ['diabetes']
      };

      const result = notificationService._formatPatientSummary(patientSummary, 'medium');

      expect(result.name).toBe('Jane Doe');
      expect(result.age).toBe(28);
      expect(result.gender).toBe('female');
      expect(result.symptoms).toEqual(['headache', 'nausea']);
      expect(result.severity).toBe('medium');
      expect(result.contact).toBe('9876543210');
      expect(result.medicalHistory).toEqual(['diabetes']);
      expect(result.timestamp).toBeDefined();
    });

    test('should handle missing optional fields with defaults', () => {
      const patientSummary = {
        symptoms: ['fever']
      };

      const result = notificationService._formatPatientSummary(patientSummary, 'low');

      expect(result.name).toBe('Patient');
      expect(result.age).toBe('Unknown');
      expect(result.gender).toBe('Unknown');
      expect(result.symptoms).toEqual(['fever']);
      expect(result.contact).toBe('Not provided');
      expect(result.medicalHistory).toEqual([]);
    });

    test('should convert single symptom string to array', () => {
      const patientSummary = {
        symptoms: 'fever'
      };

      const result = notificationService._formatPatientSummary(patientSummary, 'low');

      expect(result.symptoms).toEqual(['fever']);
    });
  });

  describe('_generateNotificationContent', () => {
    test('should generate critical severity notification content', () => {
      const patientSummary = {
        name: 'Emergency Patient',
        age: 65,
        gender: 'male',
        symptoms: ['chest pain', 'difficulty breathing']
      };

      const result = notificationService._generateNotificationContent(
        patientSummary,
        'critical',
        'EMERGENCY'
      );

      expect(result.title).toContain('EMERGENCY');
      expect(result.title).toContain('🚨');
      expect(result.message).toContain('CRITICAL CASE');
      expect(result.message).toContain('Emergency Patient');
      expect(result.message).toContain('chest pain');
    });

    test('should generate high severity notification content', () => {
      const patientSummary = {
        name: 'Urgent Patient',
        age: 45,
        gender: 'female',
        symptoms: ['severe abdominal pain']
      };

      const result = notificationService._generateNotificationContent(
        patientSummary,
        'high',
        'CHC'
      );

      expect(result.title).toContain('URGENT');
      expect(result.title).toContain('⚠️');
      expect(result.message).toContain('URGENT CASE');
      expect(result.message).toContain('CHC');
    });

    test('should generate medium severity notification content', () => {
      const patientSummary = {
        name: 'Regular Patient',
        age: 35,
        symptoms: ['persistent cough']
      };

      const result = notificationService._generateNotificationContent(
        patientSummary,
        'medium',
        'PHC'
      );

      expect(result.title).toContain('New patient referral');
      expect(result.message).toContain('New referral');
      expect(result.message).toContain('PHC');
    });

    test('should generate low severity notification content', () => {
      const patientSummary = {
        name: 'Consultation Patient',
        age: 30,
        symptoms: ['mild headache']
      };

      const result = notificationService._generateNotificationContent(
        patientSummary,
        'low',
        'ASHA'
      );

      expect(result.title).toContain('consultation request');
      expect(result.message).toContain('Consultation request');
    });

    test('should limit symptoms to first 3 in message', () => {
      const patientSummary = {
        name: 'Patient',
        age: 40,
        symptoms: ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5']
      };

      const result = notificationService._generateNotificationContent(
        patientSummary,
        'medium',
        'PHC'
      );

      expect(result.message).toContain('symptom1');
      expect(result.message).toContain('symptom2');
      expect(result.message).toContain('symptom3');
      expect(result.message).not.toContain('symptom4');
    });
  });

  describe('createBulkNotifications', () => {
    test('should create notifications for multiple workers', async () => {
      const mockNotification = {
        id: 'notif-123',
        worker_id: 'worker-123',
        status: 'pending'
      };

      query.mockResolvedValue({ rows: [mockNotification] });

      const workers = [
        { id: 'worker-1' },
        { id: 'worker-2' },
        { id: 'worker-3' }
      ];

      const notificationParams = {
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['fever'],
          age: 30
        },
        severity: 'low',
        facilityType: 'ASHA'
      };

      const results = await notificationService.createBulkNotifications(
        workers,
        notificationParams
      );

      expect(results).toHaveLength(3);
      expect(query).toHaveBeenCalledTimes(3);
    });

    test('should continue creating notifications even if one fails', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ rows: [{ id: 'notif-3' }] });

      const workers = [
        { id: 'worker-1' },
        { id: 'worker-2' },
        { id: 'worker-3' }
      ];

      const notificationParams = {
        patientId: 'patient-123',
        patientSummary: {
          symptoms: ['fever'],
          age: 30
        },
        severity: 'low',
        facilityType: 'ASHA'
      };

      const results = await notificationService.createBulkNotifications(
        workers,
        notificationParams
      );

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('notif-1');
      expect(results[1].id).toBe('notif-3');
    });
  });
});


describe('NotificationService - Notification Delivery', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('deliverInAppNotification', () => {
    test('should deliver in-app notification successfully', async () => {
      const mockNotification = {
        id: 'notif-123',
        delivery_status: { app: 'delivered' }
      };

      query
        .mockResolvedValueOnce({ rows: [mockNotification] }) // Update query
        .mockResolvedValueOnce({ rows: [{ exists: false }] }); // Analytics check

      const result = await notificationService.deliverInAppNotification('notif-123');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('app');
      expect(result.status).toBe('delivered');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE worker_notifications'),
        ['notif-123']
      );
    });

    test('should throw error when notification not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await expect(notificationService.deliverInAppNotification('invalid-id'))
        .rejects
        .toThrow('Notification not found');
    });

    test('should handle database error during delivery', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      await expect(notificationService.deliverInAppNotification('notif-123'))
        .rejects
        .toThrow('Failed to deliver in-app notification');
    });
  });

  describe('deliverSMSNotification', () => {
    test('should send SMS notification successfully', async () => {
      const mockNotification = {
        id: 'notif-123',
        title: 'New patient referral',
        priority: 'medium',
        patient_summary: JSON.stringify({
          name: 'John Doe',
          age: 35,
          symptoms: ['fever', 'cough']
        })
      };

      const otpService = require('../../services/otpService');
      otpService.sendOTP = jest.fn().mockResolvedValue({ success: true });
      otpService.maskPhone = jest.fn().mockReturnValue('98****3210');

      query
        .mockResolvedValueOnce({ rows: [mockNotification] }) // Get notification
        .mockResolvedValueOnce({ rows: [] }) // Update delivery status
        .mockResolvedValueOnce({ rows: [{ exists: false }] }); // Analytics check

      const result = await notificationService.deliverSMSNotification(
        'notif-123',
        '9876543210'
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.status).toBe('sent');
      expect(otpService.sendOTP).toHaveBeenCalled();
    });

    test('should throw error when notification not found for SMS', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      await expect(
        notificationService.deliverSMSNotification('invalid-id', '9876543210')
      ).rejects.toThrow('Notification not found');
    });

    test('should handle SMS delivery failure', async () => {
      const mockNotification = {
        id: 'notif-123',
        title: 'Test',
        priority: 'low',
        patient_summary: JSON.stringify({ name: 'Test', age: 30, symptoms: ['fever'] })
      };

      const otpService = require('../../services/otpService');
      otpService.sendOTP = jest.fn().mockResolvedValue({ success: false });

      query.mockResolvedValueOnce({ rows: [mockNotification] });

      await expect(
        notificationService.deliverSMSNotification('notif-123', '9876543210')
      ).rejects.toThrow('SMS delivery failed');
    });
  });

  describe('deliverNotificationWithRetry', () => {
    test('should deliver notification on first attempt', async () => {
      notificationService.deliverInAppNotification = jest.fn().mockResolvedValue({
        success: true,
        channel: 'app'
      });

      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['app']
      );

      expect(result.overallSuccess).toBe(true);
      expect(result.channels.app.success).toBe(true);
      expect(result.channels.app.attempts).toBe(1);
      expect(notificationService.deliverInAppNotification).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and succeed', async () => {
      notificationService.deliverInAppNotification = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['app'],
        {},
        3
      );

      expect(result.overallSuccess).toBe(true);
      expect(result.channels.app.success).toBe(true);
      expect(result.channels.app.attempts).toBe(2);
      expect(notificationService.deliverInAppNotification).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries', async () => {
      notificationService.deliverInAppNotification = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));

      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['app'],
        {},
        3
      );

      expect(result.overallSuccess).toBe(false);
      expect(result.channels.app.success).toBe(false);
      expect(result.channels.app.attempts).toBe(3);
      expect(result.channels.app.error).toBe('Persistent failure');
    });

    test('should deliver via multiple channels', async () => {
      notificationService.deliverInAppNotification = jest.fn().mockResolvedValue({
        success: true
      });
      notificationService.deliverSMSNotification = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['app', 'sms'],
        { phoneNumber: '9876543210' }
      );

      expect(result.overallSuccess).toBe(true);
      expect(result.channels.app.success).toBe(true);
      expect(result.channels.sms.success).toBe(true);
    });

    test('should succeed if at least one channel succeeds', async () => {
      notificationService.deliverInAppNotification = jest.fn().mockResolvedValue({
        success: true
      });
      notificationService.deliverSMSNotification = jest.fn()
        .mockRejectedValue(new Error('SMS failed'));

      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['app', 'sms'],
        { phoneNumber: '9876543210' },
        2
      );

      expect(result.overallSuccess).toBe(true);
      expect(result.channels.app.success).toBe(true);
      expect(result.channels.sms.success).toBe(false);
    });

    test('should throw error for SMS without phone number', async () => {
      const result = await notificationService.deliverNotificationWithRetry(
        'notif-123',
        ['sms'],
        {},
        1
      );

      expect(result.overallSuccess).toBe(false);
      expect(result.channels.sms.success).toBe(false);
      expect(result.channels.sms.error).toContain('Phone number required');
    });
  });

  describe('_formatSMSMessage', () => {
    test('should format SMS message with all details', () => {
      const notification = {
        priority: 'medium',
        title: 'New patient referral',
        patient_summary: JSON.stringify({
          name: 'John Doe',
          age: 35,
          symptoms: ['fever', 'cough', 'headache']
        })
      };

      const result = notificationService._formatSMSMessage(notification);

      expect(result).toContain('New patient referral');
      expect(result).toContain('John Doe');
      expect(result).toContain('35');
      expect(result).toContain('fever');
      expect(result).toContain('cough');
      expect(result).not.toContain('headache'); // Should limit to 2 symptoms
    });

    test('should add urgency prefix for critical notifications', () => {
      const notification = {
        priority: 'critical',
        title: 'Emergency case',
        patient_summary: JSON.stringify({
          name: 'Emergency Patient',
          age: 60,
          symptoms: ['chest pain']
        })
      };

      const result = notificationService._formatSMSMessage(notification);

      expect(result).toContain('🚨 URGENT');
      expect(result).toContain('Emergency case');
    });

    test('should handle patient summary as object', () => {
      const notification = {
        priority: 'low',
        title: 'Consultation',
        patient_summary: {
          name: 'Jane Doe',
          age: 28,
          symptoms: ['mild headache']
        }
      };

      const result = notificationService._formatSMSMessage(notification);

      expect(result).toContain('Jane Doe');
      expect(result).toContain('28');
      expect(result).toContain('mild headache');
    });
  });

  describe('_logNotificationDelivery', () => {
    test('should log successful delivery', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // Table exists
        .mockResolvedValueOnce({ rows: [] }); // Insert log

      await notificationService._logNotificationDelivery(
        'notif-123',
        'app',
        'delivered'
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO analytics_events'),
        expect.arrayContaining([
          'notification_delivery',
          expect.any(String)
        ])
      );
    });

    test('should skip logging if analytics table does not exist', async () => {
      query.mockResolvedValueOnce({ rows: [{ exists: false }] });

      await notificationService._logNotificationDelivery(
        'notif-123',
        'app',
        'delivered'
      );

      expect(query).toHaveBeenCalledTimes(1); // Only table check
    });

    test('should not throw error if logging fails', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ exists: true }] })
        .mockRejectedValueOnce(new Error('Logging failed'));

      await expect(
        notificationService._logNotificationDelivery('notif-123', 'app', 'delivered')
      ).resolves.not.toThrow();
    });
  });
});


describe('NotificationService - Worker Selection Logic', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('findAvailableWorkers', () => {
    test('should find available workers by type and location', async () => {
      const mockWorkers = [
        {
          id: 'worker-1',
          name: 'Worker One',
          phone: '9876543210',
          role: 'asha',
          location: { lat: 12.9716, lng: 77.5946 },
          is_active: true,
          on_duty_status: true,
          distance_km: 2.5,
          current_caseload: 2
        },
        {
          id: 'worker-2',
          name: 'Worker Two',
          phone: '9876543211',
          role: 'asha',
          location: { lat: 12.9800, lng: 77.6000 },
          is_active: true,
          on_duty_status: true,
          distance_km: 5.0,
          current_caseload: 1
        }
      ];

      query.mockResolvedValue({ rows: mockWorkers });

      const location = { lat: 12.9716, lng: 77.5946 };
      const result = await notificationService.findAvailableWorkers('asha', location);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('worker-1');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['asha', location.lat, location.lng])
      );
    });

    test('should filter workers by max distance', async () => {
      query.mockResolvedValue({ rows: [] });

      const location = { lat: 12.9716, lng: 77.5946 };
      const result = await notificationService.findAvailableWorkers(
        'asha',
        location,
        { maxDistance: 10 }
      );

      expect(result).toHaveLength(0);
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([10])
      );
    });

    test('should limit number of workers returned', async () => {
      const mockWorkers = Array(10).fill(null).map((_, i) => ({
        id: `worker-${i}`,
        name: `Worker ${i}`,
        current_caseload: i
      }));

      query.mockResolvedValue({ rows: mockWorkers });

      const location = { lat: 12.9716, lng: 77.5946 };
      const result = await notificationService.findAvailableWorkers(
        'asha',
        location,
        { limit: 3 }
      );

      expect(result).toHaveLength(10); // Mock returns all, but query should have limit
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([3])
      );
    });

    test('should throw error for invalid worker type', async () => {
      const location = { lat: 12.9716, lng: 77.5946 };

      await expect(
        notificationService.findAvailableWorkers('invalid_type', location)
      ).rejects.toThrow('Invalid worker type');
    });

    test('should handle database error', async () => {
      query.mockRejectedValue(new Error('Database error'));

      const location = { lat: 12.9716, lng: 77.5946 };

      await expect(
        notificationService.findAvailableWorkers('asha', location)
      ).rejects.toThrow('Failed to find available workers');
    });
  });

  describe('selectBestWorker', () => {
    test('should select worker with lowest caseload', async () => {
      const mockWorkers = [
        {
          id: 'worker-1',
          name: 'Worker One',
          current_caseload: 1,
          distance_km: 5.0
        },
        {
          id: 'worker-2',
          name: 'Worker Two',
          current_caseload: 3,
          distance_km: 2.5
        }
      ];

      notificationService.findAvailableWorkers = jest.fn().mockResolvedValue(mockWorkers);

      const location = { lat: 12.9716, lng: 77.5946 };
      const result = await notificationService.selectBestWorker('asha', location);

      expect(result).toBeDefined();
      expect(result.id).toBe('worker-1');
      expect(result.current_caseload).toBe(1);
    });

    test('should return null when no workers available', async () => {
      notificationService.findAvailableWorkers = jest.fn().mockResolvedValue([]);

      const location = { lat: 12.9716, lng: 77.5946 };
      const result = await notificationService.selectBestWorker('asha', location);

      expect(result).toBeNull();
    });

    test('should handle error from findAvailableWorkers', async () => {
      notificationService.findAvailableWorkers = jest.fn()
        .mockRejectedValue(new Error('Database error'));

      const location = { lat: 12.9716, lng: 77.5946 };

      await expect(
        notificationService.selectBestWorker('asha', location)
      ).rejects.toThrow('Failed to select best worker');
    });
  });

  describe('getWorkerCaseload', () => {
    test('should return worker caseload statistics', async () => {
      const mockStats = {
        pending_count: '3',
        acknowledged_count: '2',
        responded_count: '1',
        completed_count: '5',
        total_count: '11',
        avg_response_time_minutes: '15.5'
      };

      query.mockResolvedValue({ rows: [mockStats] });

      const result = await notificationService.getWorkerCaseload('worker-123', 24);

      expect(result.workerId).toBe('worker-123');
      expect(result.timeWindowHours).toBe(24);
      expect(result.pending).toBe(3);
      expect(result.acknowledged).toBe(2);
      expect(result.responded).toBe(1);
      expect(result.completed).toBe(5);
      expect(result.total).toBe(11);
      expect(result.avgResponseTimeMinutes).toBe(15.5);
    });

    test('should handle zero caseload', async () => {
      const mockStats = {
        pending_count: '0',
        acknowledged_count: '0',
        responded_count: '0',
        completed_count: '0',
        total_count: '0',
        avg_response_time_minutes: null
      };

      query.mockResolvedValue({ rows: [mockStats] });

      const result = await notificationService.getWorkerCaseload('worker-123');

      expect(result.total).toBe(0);
      expect(result.avgResponseTimeMinutes).toBe(0);
    });

    test('should use custom time window', async () => {
      const mockStats = {
        pending_count: '1',
        acknowledged_count: '0',
        responded_count: '0',
        completed_count: '0',
        total_count: '1',
        avg_response_time_minutes: null
      };

      query.mockResolvedValue({ rows: [mockStats] });

      await notificationService.getWorkerCaseload('worker-123', 48);

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        ['worker-123', 48]
      );
    });

    test('should handle database error', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.getWorkerCaseload('worker-123')
      ).rejects.toThrow('Failed to get worker caseload');
    });
  });

  describe('checkWorkerAvailability', () => {
    test('should return available for on-duty worker with low caseload', async () => {
      const mockWorker = {
        id: 'worker-123',
        name: 'Test Worker',
        role: 'asha',
        is_active: true,
        on_duty_status: true,
        location: { lat: 12.9716, lng: 77.5946 }
      };

      query.mockResolvedValue({ rows: [mockWorker] });

      notificationService.getWorkerCaseload = jest.fn().mockResolvedValue({
        pending: 2,
        total: 5
      });

      const result = await notificationService.checkWorkerAvailability('worker-123');

      expect(result.available).toBe(true);
      expect(result.worker).toBeDefined();
      expect(result.caseload).toBeDefined();
    });

    test('should return unavailable when worker not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await notificationService.checkWorkerAvailability('invalid-id');

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Worker not found');
    });

    test('should return unavailable when worker is inactive', async () => {
      const mockWorker = {
        id: 'worker-123',
        name: 'Test Worker',
        is_active: false,
        on_duty_status: true
      };

      query.mockResolvedValue({ rows: [mockWorker] });

      const result = await notificationService.checkWorkerAvailability('worker-123');

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Worker account is inactive');
    });

    test('should return unavailable when worker is off duty', async () => {
      const mockWorker = {
        id: 'worker-123',
        name: 'Test Worker',
        is_active: true,
        on_duty_status: false
      };

      query.mockResolvedValue({ rows: [mockWorker] });

      const result = await notificationService.checkWorkerAvailability('worker-123');

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Worker is off duty');
    });

    test('should return unavailable when worker has too many pending cases', async () => {
      const mockWorker = {
        id: 'worker-123',
        name: 'Test Worker',
        is_active: true,
        on_duty_status: true
      };

      query.mockResolvedValue({ rows: [mockWorker] });

      notificationService.getWorkerCaseload = jest.fn().mockResolvedValue({
        pending: 15,
        total: 20
      });

      const result = await notificationService.checkWorkerAvailability('worker-123');

      expect(result.available).toBe(false);
      expect(result.reason).toContain('pending cases');
    });

    test('should handle database error', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.checkWorkerAvailability('worker-123')
      ).rejects.toThrow('Failed to check worker availability');
    });
  });
});
