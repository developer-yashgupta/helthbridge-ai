const express = require('express');
const router = express.Router();
const GeminiService = require('../services/geminiService');
const RoutingEngine = require('../services/routingEngine');
const ConversationService = require('../services/conversationService');
const NotificationService = require('../services/notificationService');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const geminiService = new GeminiService();
const routingEngine = new RoutingEngine();
const conversationService = new ConversationService();
const notificationService = new NotificationService();

/**
 * POST /api/voice-assistant/analyze
 * Analyzes user message and returns AI response with routing
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      userId,
      message,
      conversationId,
      language = 'hi',
      patientInfo
    } = req.body;

    // Validation
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    // Create or get conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversationResult = await conversationService.createConversation(userId, { language });
      currentConversationId = conversationResult.conversation.id;
    }

    // Get conversation history for context
    const conversationData = await conversationService.getConversation(currentConversationId, userId);
    const conversationHistory = conversationData.conversation?.messages || [];

    // Save user message
    const userMessageResult = await conversationService.addMessage(
      currentConversationId,
      'user',
      message,
      { language }
    );

    // Analyze symptoms using Gemini
    console.log('=== Starting Gemini Analysis ===');
    console.log('User message:', message);
    console.log('Patient info:', patientInfo);

    const analysis = await geminiService.analyzeSymptoms(
      message,
      conversationHistory,
      { ...patientInfo, language }
    );

    console.log('=== Analysis Result ===');
    console.log('Symptoms:', analysis.symptoms);
    console.log('Confidence:', analysis.confidence);

    // Assess severity only if symptoms are present
    let severityAssessment;
    if (analysis.symptoms && analysis.symptoms.length > 0) {
      severityAssessment = await geminiService.assessSeverity(
        analysis.symptoms,
        patientInfo
      );
    } else {
      // No symptoms detected - this is likely a greeting or general question
      severityAssessment = {
        score: 0,
        level: 'low',
        emergencyKeywords: [],
        reasoning: 'No specific symptoms reported yet. This appears to be an initial greeting or general inquiry.',
        recommendedFacility: 'ASHA',
        timeframe: 'as needed',
        riskFactors: [],
        redFlags: []
      };
    }

    // Determine routing
    let routingDecision;

    if (analysis.symptoms && analysis.symptoms.length > 0) {
      // Normal case: symptoms detected, use routing engine
      routingDecision = await routingEngine.determineRouting({
        symptoms: analysis.symptoms,
        severityScore: severityAssessment.score,
        severityLevel: severityAssessment.level,
        location: patientInfo.location,
        patientInfo
      });
    } else {
      // No symptoms detected (greeting or general question)
      // Provide default routing without calling routing engine
      routingDecision = {
        severityScore: 0,
        severityLevel: 'low',
        recommendedFacilityType: 'ASHA',
        facility: null,
        reasoning: 'No specific symptoms reported. Feel free to describe your symptoms when you\'re ready, and I\'ll provide personalized health guidance.',
        hasEmergencyKeywords: false,
        riskFactorsApplied: [],
        priority: 'low',
        timeframe: 'as needed'
      };
    }

    // Generate healthcare response
    const aiResponse = await geminiService.generateHealthcareResponse(
      message,
      conversationHistory,
      { ...patientInfo, language }
    );

    // Save assistant message
    const assistantMessageResult = await conversationService.addMessage(
      currentConversationId,
      'assistant',
      aiResponse,
      { language }
    );

    // Save routing decision
    const routingResult = await query(
      `INSERT INTO routing_decisions 
       (conversation_id, message_id, user_id, symptoms, severity_level, 
        severity_score, recommended_facility, facility_id, reasoning, ai_confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        currentConversationId,
        assistantMessageResult.message.id,
        userId,
        JSON.stringify(analysis.symptoms),
        severityAssessment.level,
        severityAssessment.score,
        routingDecision.recommendedFacilityType,
        routingDecision.facility?.id || null,
        routingDecision.reasoning,
        analysis.confidence || 0.85
      ]
    );

    // Trigger worker notification if facility assigned
    if (routingDecision.facility) {
      const workerType = _mapFacilityToWorkerType(routingDecision.recommendedFacilityType);

      // Find available worker
      const worker = await notificationService.findAvailableWorker(
        workerType,
        patientInfo.location
      );

      if (worker) {
        // Create notification
        const notificationResult = await notificationService.createNotification({
          workerId: worker.id,
          workerType,
          patientId: userId,
          routingDecisionId: routingResult.rows[0].id,
          symptoms: analysis.symptoms,
          severity: severityAssessment.level,
          patientInfo,
          facilityType: routingDecision.recommendedFacilityType
        });

        // Deliver notification
        await notificationService.deliverNotification(
          notificationResult.notification.id,
          ['app', 'sms']
        );
      }
    }

    logger.info(`Voice assistant analysis completed for user: ${userId}`);

    res.json({
      success: true,
      response: aiResponse,
      routing: {
        severity: severityAssessment.level,
        severityScore: severityAssessment.score,
        facility: routingDecision.facility,
        facilityType: routingDecision.recommendedFacilityType,
        reasoning: routingDecision.reasoning,
        priority: routingDecision.priority,
        timeframe: routingDecision.timeframe
      },
      conversationId: currentConversationId,
      messageId: assistantMessageResult.message.id
    });

  } catch (error) {
    console.error('=== ERROR in voice assistant analyze ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', error);
    logger.error('Error in voice assistant analyze:', error);


    res.status(500).json({
      success: false,
      error: 'Failed to analyze message',
      message: error.message
    });
  }
});

/**
 * GET /api/voice-assistant/conversations/:userId
 * Retrieves conversation history for a user
 */
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    // TODO: Add authentication check
    // if (req.user.id !== userId) {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }

    const result = await conversationService.getConversationHistory(
      userId,
      parseInt(limit),
      parseInt(offset),
      { status }
    );

    res.json(result);

  } catch (error) {
    logger.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations'
    });
  }
});

/**
 * GET /api/voice-assistant/conversation/:conversationId
 * Retrieves specific conversation with all messages
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    // TODO: Add authentication and authorization check
    // if (req.user.id !== userId) {
    //   return res.status(403).json({ success: false, error: 'Access denied' });
    // }

    const result = await conversationService.getConversation(conversationId, userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation'
    });
  }
});

/**
 * POST /api/voice-assistant/feedback
 * Submits feedback on AI response
 */
router.post('/feedback', async (req, res) => {
  try {
    const { messageId, rating, feedback, userId } = req.body;

    if (!messageId || rating === undefined) {
      return res.status(400).json({
        success: false,
        error: 'messageId and rating are required'
      });
    }

    // Save feedback to database
    const result = await query(
      `INSERT INTO message_feedback (message_id, user_id, rating, feedback, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [messageId, userId, rating, feedback]
    );

    logger.info(`Feedback submitted for message: ${messageId}`);

    res.json({
      success: true,
      feedback: result.rows[0]
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

/**
 * Helper function to map facility type to worker type
 * @private
 */
function _mapFacilityToWorkerType(facilityType) {
  const mapping = {
    'ASHA': 'asha',
    'PHC': 'phc_staff',
    'CHC': 'chc_staff',
    'EMERGENCY': 'chc_staff' // Emergency cases go to CHC staff
  };
  return mapping[facilityType] || 'asha';
}

module.exports = router;
