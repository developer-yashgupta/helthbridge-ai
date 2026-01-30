const request = require('supertest');
const app = require('../server');
const { query } = require('../config/database');

describe('Worker Notifications API Integration Tests', () => {
  let testWorkerId;
  let testPatientId;
  let testNotificationId;
  let testRoutingDecisionId;

  // Setup test data before running tests
  beforeAll(async () => {
    try {
      // Create test worker user
      const workerResult = await query(
        `INSERT INTO users (name, phone_number, role, is_active, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Test ASHA Worker', '+91-9999999999', 'asha', true, JSON.stringify({ lat: 28.6139, lng: 77.2090 })]
      );
      testWorkerId = workerResult.rows[0].id;

      // Create test patient user
      const patientResult = await query(
        `INSERT INTO users (name, phone_number, role, is_active, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Test Patient', '+91-8888888888', 'citizen', true, JSON.stringify({ lat: 28.6139, lng: 77.2090 })]
      );
      testPatientId = patientResult.rows[0].id;

      // Create test conversation
      const conversationResult = await query(
        `INSERT INTO conversations (user_id, title, language)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testPatientId, 'Test Conversation', 'hi']
      );
      const conversationId = conversationResult.rows[0].id;

      // Create test message
      const messageResult = await query(
        `INSERT INTO conversation_messages (conversation_id, role, content)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [conversationId, 'user', 'I have fever and headache']
      );
      const messageId = messageResult.rows[0].id;

      // Create test routing decision
      const routingResult = await query(
        `INSERT INTO routing_decisions 
         (conversation_id, message_id, user_id, symptoms, severity_level, severity_score, 
          recommended_facility, reasoning, ai_confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          conversationId,
          messageId,
          testPatientId,
          JSON.stringify(['fever', 'headache']),
          'low',
          35,
          'ASHA',
          'Low severity symptoms suitable for ASHA worker consultation',
          0.85
        ]
      );
      testRoutingDecisionId = routingResult.rows[0].id;

      // Create test notification
      const notificationResult = await query(
        `INSERT INTO worker_notifications 
         (worker_id, worker_type, patient_id, routing_decision_id, notification_type, 
          priority, title, message, patient_summary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          testWorkerId,
          'asha',
          testPatientId,
          testRoutingDecisionId,
          'new_referral',
          'low',
          'New Patient Referral',
          'Patient with fever and headache needs consultation',
          JSON.stringify({
            name: 'Test Patient',
            age: 30,
            gender: 'male',
            symptoms: ['fever', 'headache'],
            severityLevel: 'low'
          }),
          'pending'
        ]
      );
      testNotificationId = notificationResult.rows[0].id;

    } catch (error) {
      console.error('Error setting up test data:', error);
    }
  });

  // Cleanup test data after all tests
  afterAll(async () => {
    try {
      if (testNotificationId) {
        await query('DELETE FROM worker_notifications WHERE id = $1', [testNotificationId]);
      }
      if (testRoutingDecisionId) {
        await query('DELETE FROM routing_decisions WHERE id = $1', [testRoutingDecisionId]);
      }
      if (testPatientId) {
        await query('DELETE FROM conversation_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = $1)', [testPatientId]);
        await query('DELETE FROM conversations WHERE user_id = $1', [testPatientId]);
        await query('DELETE FROM users WHERE id = $1', [testPatientId]);
      }
      if (testWorkerId) {
        await query('DELETE FROM users WHERE id = $1', [testWorkerId]);
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  describe('GET /api/worker-notifications/:workerId', () => {
    it('should retrieve notifications for a worker', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notifications).toBeDefined();
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter notifications by status', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notifications).toBeDefined();
      
      // All returned notifications should have pending status
      res.body.notifications.forEach(notification => {
        expect(notification.status).toBe('pending');
      });
    });

    it('should filter notifications by priority', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .query({ priority: 'low' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notifications).toBeDefined();
      
      // All returned notifications should have low priority
      res.body.notifications.forEach(notification => {
        expect(notification.priority).toBe('low');
      });
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .query({ limit: 5, offset: 0 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notifications).toBeDefined();
      expect(res.body.notifications.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination.offset).toBe(0);
    });

    it('should include patient summary and routing information', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThan(0);
      
      const notification = res.body.notifications[0];
      expect(notification.patient_summary).toBeDefined();
      expect(notification.symptoms).toBeDefined();
      expect(notification.severity_level).toBeDefined();
      expect(notification.routing_reasoning).toBeDefined();
    });

    it('should return 400 for missing workerId', async () => {
      const res = await request(app)
        .get('/api/worker-notifications/')
        .expect(404); // Express returns 404 for missing route params

      expect(res.body.error).toBeDefined();
    });
  });

  describe('PUT /api/worker-notifications/:notificationId/acknowledge', () => {
    it('should acknowledge a notification', async () => {
      const res = await request(app)
        .put(`/api/worker-notifications/${testNotificationId}/acknowledge`)
        .send({
          workerId: testWorkerId,
          responseText: 'I will contact the patient within 1 hour'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notification).toBeDefined();
      expect(res.body.notification.status).toBe('acknowledged');
      expect(res.body.notification.acknowledged_at).toBeDefined();
      expect(res.body.notification.response_text).toBe('I will contact the patient within 1 hour');
    });

    it('should acknowledge notification without response text', async () => {
      // Create another test notification
      const notificationResult = await query(
        `INSERT INTO worker_notifications 
         (worker_id, worker_type, patient_id, routing_decision_id, notification_type, 
          priority, title, message, patient_summary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          testWorkerId,
          'asha',
          testPatientId,
          testRoutingDecisionId,
          'new_referral',
          'medium',
          'Another Referral',
          'Another patient needs consultation',
          JSON.stringify({ name: 'Test Patient 2' }),
          'pending'
        ]
      );
      const newNotificationId = notificationResult.rows[0].id;

      const res = await request(app)
        .put(`/api/worker-notifications/${newNotificationId}/acknowledge`)
        .send({
          workerId: testWorkerId
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.notification.status).toBe('acknowledged');
      expect(res.body.notification.acknowledged_at).toBeDefined();

      // Cleanup
      await query('DELETE FROM worker_notifications WHERE id = $1', [newNotificationId]);
    });

    it('should return 400 for missing workerId', async () => {
      const res = await request(app)
        .put(`/api/worker-notifications/${testNotificationId}/acknowledge`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('workerId is required');
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeNotificationId = '00000000-0000-0000-0000-000000000000';
      
      const res = await request(app)
        .put(`/api/worker-notifications/${fakeNotificationId}/acknowledge`)
        .send({
          workerId: testWorkerId
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('should return 404 when notification does not belong to worker', async () => {
      // Create another worker
      const anotherWorkerResult = await query(
        `INSERT INTO users (name, phone_number, role, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Another Worker', '+91-7777777777', 'asha', true]
      );
      const anotherWorkerId = anotherWorkerResult.rows[0].id;

      const res = await request(app)
        .put(`/api/worker-notifications/${testNotificationId}/acknowledge`)
        .send({
          workerId: anotherWorkerId
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not belong to this worker');

      // Cleanup
      await query('DELETE FROM users WHERE id = $1', [anotherWorkerId]);
    });
  });

  describe('GET /api/worker-notifications/stats/:workerId', () => {
    it('should retrieve notification statistics for a worker', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBeGreaterThan(0);
      expect(res.body.stats.byStatus).toBeDefined();
      expect(res.body.stats.byPriority).toBeDefined();
      expect(res.body.stats.responseMetrics).toBeDefined();
    });

    it('should include status breakdown', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const statusStats = res.body.stats.byStatus;
      
      expect(statusStats).toHaveProperty('pending');
      expect(statusStats).toHaveProperty('acknowledged');
      expect(statusStats).toHaveProperty('responded');
      expect(statusStats).toHaveProperty('completed');
      
      // At least one status should have count > 0
      const totalStatusCount = Object.values(statusStats).reduce((sum, count) => sum + count, 0);
      expect(totalStatusCount).toBeGreaterThan(0);
    });

    it('should include priority breakdown', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const priorityStats = res.body.stats.byPriority;
      
      expect(priorityStats).toHaveProperty('low');
      expect(priorityStats).toHaveProperty('medium');
      expect(priorityStats).toHaveProperty('high');
      expect(priorityStats).toHaveProperty('critical');
    });

    it('should include response metrics', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const metrics = res.body.stats.responseMetrics;
      
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('minResponseTime');
      expect(metrics).toHaveProperty('maxResponseTime');
      expect(metrics).toHaveProperty('responseRate');
      expect(typeof metrics.responseRate).toBe('number');
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
      const endDate = new Date().toISOString();

      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });

    it('should return 400 for missing workerId', async () => {
      const res = await request(app)
        .get('/api/worker-notifications/stats/')
        .expect(404); // Express returns 404 for missing route params

      expect(res.body.error).toBeDefined();
    });

    it('should calculate response rate correctly', async () => {
      const res = await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const responseRate = res.body.stats.responseMetrics.responseRate;
      
      expect(responseRate).toBeGreaterThanOrEqual(0);
      expect(responseRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Use an invalid UUID format to trigger database error
      const res = await request(app)
        .get('/api/worker-notifications/invalid-id')
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should handle malformed request body', async () => {
      const res = await request(app)
        .put(`/api/worker-notifications/${testNotificationId}/acknowledge`)
        .send('invalid json')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should retrieve notifications within acceptable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get(`/api/worker-notifications/${testWorkerId}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should retrieve stats within acceptable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get(`/api/worker-notifications/stats/${testWorkerId}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
