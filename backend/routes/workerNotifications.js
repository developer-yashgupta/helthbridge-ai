const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /api/worker-notifications/:workerId
 * Retrieves notifications for a healthcare worker with filtering and pagination
 */
router.get('/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { 
      status = 'all', 
      limit = 20, 
      offset = 0,
      priority,
      startDate,
      endDate
    } = req.query;

    // TODO: Add authentication check for worker access
    // if (req.user.id !== workerId || !req.user.roles.includes('healthcare_worker')) {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }

    // Validation
    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'workerId is required'
      });
    }

    // Build query conditions
    const conditions = ['wn.worker_id = $1'];
    const params = [workerId];
    let paramIndex = 2;

    // Filter by status
    if (status !== 'all') {
      conditions.push(`wn.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Filter by priority
    if (priority) {
      conditions.push(`wn.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    // Filter by date range
    if (startDate) {
      conditions.push(`wn.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`wn.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get notifications with patient and routing information
    const notificationsQuery = `
      SELECT 
        wn.*,
        u.name as patient_name,
        u.phone_number as patient_phone,
        rd.symptoms,
        rd.severity_level,
        rd.severity_score,
        rd.recommended_facility,
        rd.reasoning as routing_reasoning,
        hr.name as facility_name,
        hr.contact_number as facility_contact,
        hr.location as facility_location
      FROM worker_notifications wn
      LEFT JOIN users u ON wn.patient_id = u.id
      LEFT JOIN routing_decisions rd ON wn.routing_decision_id = rd.id
      LEFT JOIN healthcare_resources hr ON rd.facility_id = hr.id
      WHERE ${whereClause}
      ORDER BY wn.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const notificationsResult = await query(notificationsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM worker_notifications wn
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, paramIndex - 1));
    const totalCount = parseInt(countResult.rows[0].total);

    logger.info(`Retrieved ${notificationsResult.rows.length} notifications for worker: ${workerId}`);

    res.json({
      success: true,
      notifications: notificationsResult.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + notificationsResult.rows.length) < totalCount
      }
    });

  } catch (error) {
    logger.error('Error retrieving worker notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications',
      message: error.message
    });
  }
});

/**
 * PUT /api/worker-notifications/:notificationId/acknowledge
 * Acknowledges receipt of notification and allows worker to add response
 */
router.put('/:notificationId/acknowledge', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { workerId, responseText } = req.body;

    // Validation
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'notificationId is required'
      });
    }

    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'workerId is required'
      });
    }

    // TODO: Add authentication check
    // if (req.user.id !== workerId) {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }

    // Verify notification belongs to worker
    const verifyQuery = `
      SELECT * FROM worker_notifications
      WHERE id = $1 AND worker_id = $2
    `;
    const verifyResult = await query(verifyQuery, [notificationId, workerId]);

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or does not belong to this worker'
      });
    }

    // Update notification status
    const updateQuery = `
      UPDATE worker_notifications
      SET 
        status = 'acknowledged',
        acknowledged_at = CURRENT_TIMESTAMP,
        response_text = $1
      WHERE id = $2
      RETURNING *
    `;

    const updateResult = await query(updateQuery, [responseText || null, notificationId]);

    logger.info(`Notification ${notificationId} acknowledged by worker: ${workerId}`);

    res.json({
      success: true,
      notification: updateResult.rows[0]
    });

  } catch (error) {
    logger.error('Error acknowledging notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge notification',
      message: error.message
    });
  }
});

/**
 * GET /api/worker-notifications/stats/:workerId
 * Retrieves notification statistics and performance metrics for a worker
 */
router.get('/stats/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    // TODO: Add authentication check
    // if (req.user.id !== workerId) {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }

    // Validation
    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'workerId is required'
      });
    }

    // Build date filter
    let dateFilter = '';
    const params = [workerId];
    
    if (startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'AND created_at >= $2';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'AND created_at <= $2';
      params.push(endDate);
    }

    // Get notification counts by status
    const statusStatsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM worker_notifications
      WHERE worker_id = $1 ${dateFilter}
      GROUP BY status
    `;

    const statusStatsResult = await query(statusStatsQuery, params);

    // Get notification counts by priority
    const priorityStatsQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM worker_notifications
      WHERE worker_id = $1 ${dateFilter}
      GROUP BY priority
    `;

    const priorityStatsResult = await query(priorityStatsQuery, params);

    // Calculate average response time
    const responseTimeQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_response_seconds,
        MIN(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as min_response_seconds,
        MAX(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as max_response_seconds
      FROM worker_notifications
      WHERE worker_id = $1 
        AND acknowledged_at IS NOT NULL
        ${dateFilter}
    `;

    const responseTimeResult = await query(responseTimeQuery, params);

    // Get total notifications
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM worker_notifications
      WHERE worker_id = $1 ${dateFilter}
    `;

    const totalResult = await query(totalQuery, params);

    // Format status stats
    const statusStats = {
      pending: 0,
      acknowledged: 0,
      responded: 0,
      completed: 0
    };

    statusStatsResult.rows.forEach(row => {
      statusStats[row.status] = parseInt(row.count);
    });

    // Format priority stats
    const priorityStats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    priorityStatsResult.rows.forEach(row => {
      priorityStats[row.priority] = parseInt(row.count);
    });

    // Format response time
    const responseTime = responseTimeResult.rows[0];
    const avgResponseTime = responseTime.avg_response_seconds 
      ? Math.round(responseTime.avg_response_seconds)
      : null;
    const minResponseTime = responseTime.min_response_seconds
      ? Math.round(responseTime.min_response_seconds)
      : null;
    const maxResponseTime = responseTime.max_response_seconds
      ? Math.round(responseTime.max_response_seconds)
      : null;

    // Calculate response rate
    const totalNotifications = parseInt(totalResult.rows[0].total);
    const acknowledgedCount = statusStats.acknowledged + statusStats.responded + statusStats.completed;
    const responseRate = totalNotifications > 0 
      ? ((acknowledgedCount / totalNotifications) * 100).toFixed(2)
      : 0;

    logger.info(`Retrieved stats for worker: ${workerId}`);

    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        byStatus: statusStats,
        byPriority: priorityStats,
        responseMetrics: {
          avgResponseTime: avgResponseTime,
          minResponseTime: minResponseTime,
          maxResponseTime: maxResponseTime,
          responseRate: parseFloat(responseRate)
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving worker stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

module.exports = router;
