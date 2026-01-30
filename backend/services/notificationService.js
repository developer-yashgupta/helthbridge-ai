const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * NotificationService - Handles healthcare worker notifications
 * Manages notification creation, delivery, and worker selection
 */
class NotificationService {
  constructor() {
    this.notificationTypes = {
      NEW_REFERRAL: 'new_referral',
      URGENT_CASE: 'urgent_case',
      FOLLOW_UP: 'follow_up'
    };

    this.priorities = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.workerTypes = {
      ASHA: 'asha',
      PHC_STAFF: 'phc_staff',
      CHC_STAFF: 'chc_staff'
    };
  }

  /**
   * Create a notification for a healthcare worker
   * @param {Object} params - Notification parameters
   * @returns {Object} Created notification
   */
  async createNotification(params) {
    const {
      workerId,
      workerType,
      patientId,
      routingDecisionId,
      symptoms,
      severity,
      patientInfo,
      facilityType
    } = params;

    try {
      // Determine notification type and priority
      const notificationType = this._determineNotificationType(severity);
      const priority = this._mapSeverityToPriority(severity);

      // Format patient summary
      const patientSummary = this._formatPatientSummary({
        patientInfo,
        symptoms,
        severity
      });

      // Create notification title and message
      const { title, message } = this._createNotificationContent({
        patientInfo,
        symptoms,
        severity,
        facilityType
      });

      // Insert notification into database
      const result = await query(
        `INSERT INTO worker_notifications 
        (worker_id, worker_type, patient_id, routing_decision_id, 
         notification_type, priority, title, message, patient_summary, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          workerId,
          workerType,
          patientId,
          routingDecisionId,
          notificationType,
          priority,
          title,
          message,
          JSON.stringify(patientSummary),
          'pending'
        ]
      );

      const notification = result.rows[0];
      logger.info(`Notification created: ${notification.id} for worker: ${workerId}`);

      return {
        success: true,
        notification
      };
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Deliver notification via multiple channels
   * @param {string} notificationId - Notification ID
   * @param {Array} channels - Delivery channels ['app', 'sms']
   * @returns {Object} Delivery result
   */
  async deliverNotification(notificationId, channels = ['app']) {
    try {
      // Get notification details
      const notificationResult = await query(
        `SELECT wn.*, u.phone_number, u.name as worker_name
         FROM worker_notifications wn
         JOIN users u ON wn.worker_id = u.id
         WHERE wn.id = $1`,
        [notificationId]
      );

      if (notificationResult.rows.length === 0) {
        throw new Error('Notification not found');
      }

      const notification = notificationResult.rows[0];
      const deliveryResults = [];

      // Deliver via in-app notification (always enabled)
      if (channels.includes('app')) {
        const appResult = await this._deliverInApp(notification);
        deliveryResults.push({ channel: 'app', ...appResult });
      }

      // Deliver via SMS if requested and phone number available
      if (channels.includes('sms') && notification.phone_number) {
        const smsResult = await this._deliverSMS(notification);
        deliveryResults.push({ channel: 'sms', ...smsResult });
      }

      // Update notification with delivery channels
      await query(
        `UPDATE worker_notifications 
         SET sent_via = $1
         WHERE id = $2`,
        [JSON.stringify(channels), notificationId]
      );

      // Log notification delivery
      await this._logNotificationDelivery(notificationId, deliveryResults);

      logger.info(`Notification ${notificationId} delivered via: ${channels.join(', ')}`);

      return {
        success: true,
        deliveryResults
      };
    } catch (error) {
      logger.error('Error delivering notification:', error);
      
      // Implement retry logic
      await this._scheduleRetry(notificationId);
      
      throw error;
    }
  }

  /**
   * Find available worker by type and location
   * @param {string} workerType - Type of worker (asha, phc_staff, chc_staff)
   * @param {Object} location - User location {lat, lng}
   * @returns {Object} Selected worker
   */
  async findAvailableWorker(workerType, location) {
    try {
      // Query for available workers with load balancing
      const result = await query(
        `SELECT u.id, u.name, u.phone_number, u.location,
                COUNT(wn.id) as current_caseload,
                ST_Distance(
                  ST_SetSRID(ST_MakePoint(u.location->>'lng', u.location->>'lat')::geometry, 4326),
                  ST_SetSRID(ST_MakePoint($2, $3)::geometry, 4326)
                ) as distance_meters
         FROM users u
         LEFT JOIN worker_notifications wn ON u.id = wn.worker_id 
           AND wn.status IN ('pending', 'acknowledged')
         WHERE u.role = $1 
           AND u.is_active = true
           AND (u.on_duty_status IS NULL OR u.on_duty_status = true)
         GROUP BY u.id, u.name, u.phone_number, u.location
         ORDER BY current_caseload ASC, distance_meters ASC
         LIMIT 1`,
        [workerType, location.lng, location.lat]
      );

      if (result.rows.length === 0) {
        logger.warn(`No available ${workerType} workers found`);
        return null;
      }

      const worker = result.rows[0];
      logger.info(`Selected worker: ${worker.id} with caseload: ${worker.current_caseload}`);

      return worker;
    } catch (error) {
      logger.error('Error finding available worker:', error);
      throw error;
    }
  }

  /**
   * Determine notification type based on severity
   * @private
   */
  _determineNotificationType(severity) {
    if (severity === 'critical') {
      return this.notificationTypes.URGENT_CASE;
    }
    return this.notificationTypes.NEW_REFERRAL;
  }

  /**
   * Map severity level to notification priority
   * @private
   */
  _mapSeverityToPriority(severity) {
    const mapping = {
      low: this.priorities.LOW,
      medium: this.priorities.MEDIUM,
      high: this.priorities.HIGH,
      critical: this.priorities.CRITICAL
    };
    return mapping[severity] || this.priorities.MEDIUM;
  }

  /**
   * Format patient summary for notification
   * @private
   */
  _formatPatientSummary({ patientInfo, symptoms, severity }) {
    return {
      name: patientInfo.name || 'Unknown',
      age: patientInfo.age,
      gender: patientInfo.gender,
      contactNumber: patientInfo.phone_number,
      location: patientInfo.location,
      symptoms: symptoms,
      severityLevel: severity,
      medicalHistory: patientInfo.medical_history || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create notification title and message
   * @private
   */
  _createNotificationContent({ patientInfo, symptoms, severity, facilityType }) {
    const severityText = {
      low: 'कम गंभीर',
      medium: 'मध्यम गंभीर',
      high: 'गंभीर',
      critical: 'अत्यंत गंभीर'
    };

    const symptomsText = Array.isArray(symptoms) 
      ? symptoms.join(', ') 
      : symptoms;

    const title = severity === 'critical'
      ? `🚨 तत्काल ध्यान आवश्यक - ${patientInfo.name || 'मरीज'}`
      : `नया रेफरल - ${patientInfo.name || 'मरीज'}`;

    const message = `
मरीज: ${patientInfo.name || 'Unknown'}
उम्र: ${patientInfo.age || 'N/A'} | लिंग: ${patientInfo.gender || 'N/A'}
लक्षण: ${symptomsText}
गंभीरता: ${severityText[severity] || severity}
संपर्क: ${patientInfo.phone_number || 'N/A'}

कृपया जल्द से जल्द संपर्क करें।
    `.trim();

    return { title, message };
  }

  /**
   * Deliver notification via in-app mechanism
   * @private
   */
  async _deliverInApp(notification) {
    // In-app notification is just marking it as available in the database
    // The frontend will poll or use websockets to fetch new notifications
    return { success: true, deliveredAt: new Date() };
  }

  /**
   * Deliver notification via SMS
   * @private
   */
  async _deliverSMS(notification) {
    try {
      // Integration with existing SMS service
      // For now, just log the SMS that would be sent
      logger.info(`SMS would be sent to ${notification.phone_number}: ${notification.title}`);
      
      // TODO: Integrate with actual SMS service (otpService or dedicated SMS gateway)
      // const smsService = require('./otpService');
      // await smsService.sendSMS(notification.phone_number, notification.message);

      return { success: true, deliveredAt: new Date() };
    } catch (error) {
      logger.error('SMS delivery failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log notification delivery
   * @private
   */
  async _logNotificationDelivery(notificationId, deliveryResults) {
    try {
      await query(
        `INSERT INTO notification_logs (notification_id, delivery_results, logged_at)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [notificationId, JSON.stringify(deliveryResults), new Date()]
      );
    } catch (error) {
      logger.error('Error logging notification delivery:', error);
      // Don't throw - logging failure shouldn't break notification delivery
    }
  }

  /**
   * Schedule retry for failed notification
   * @private
   */
  async _scheduleRetry(notificationId) {
    try {
      // Simple retry mechanism - update status to indicate retry needed
      await query(
        `UPDATE worker_notifications 
         SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{retry_scheduled}',
           'true'::jsonb
         )
         WHERE id = $1`,
        [notificationId]
      );
      
      logger.info(`Retry scheduled for notification: ${notificationId}`);
    } catch (error) {
      logger.error('Error scheduling retry:', error);
    }
  }
}

module.exports = NotificationService;
