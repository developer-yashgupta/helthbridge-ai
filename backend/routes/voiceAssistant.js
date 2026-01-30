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
 * Supports text and image input
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      userId,
      message,
      conversationId,
      language = 'hi',
      patientInfo,
      imageData // Base64 encoded image (optional)
    } = req.body;

    // Validation
    if (!userId || (!message && !imageData)) {
      return res.status(400).json({
        success: false,
        error: 'userId and either message or imageData are required'
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
      message || '📷 Image uploaded',
      { language, hasImage: !!imageData }
    );

    // OPTIMIZED: Single Gemini call for faster response
    console.log('=== Starting Gemini Analysis ===');
    console.log('User message:', message);
    console.log('Has image:', !!imageData);

    // Generate healthcare response (this is the main thing user sees)
    let aiResponse;
    if (imageData) {
      // Use Gemini Vision for image analysis
      aiResponse = await geminiService.analyzeImageWithVision(
        imageData,
        message || 'Analyze this medical image and provide health guidance',
        conversationHistory,
        { ...patientInfo, language }
      );
    } else {
      // Regular text analysis
      aiResponse = await geminiService.generateHealthcareResponse(
        message,
        conversationHistory,
        { ...patientInfo, language }
      );
    }

    // Quick symptom detection for routing (no separate API call)
    const analysis = _quickSymptomDetection(message || aiResponse);
    
    // Fast severity assessment based on keywords
    const severityAssessment = _quickSeverityAssessment(
      message || aiResponse, 
      analysis.symptoms, 
      patientInfo
    );

    // Determine routing
    let routingDecision;
    if (analysis.symptoms.length > 0) {
      routingDecision = await routingEngine.determineRouting({
        symptoms: analysis.symptoms,
        severityScore: severityAssessment.score,
        severityLevel: severityAssessment.level,
        location: patientInfo.location,
        patientInfo
      });
    } else {
      routingDecision = {
        severityScore: 0,
        severityLevel: 'low',
        recommendedFacilityType: 'ASHA',
        facility: null,
        reasoning: 'No specific symptoms reported.',
        hasEmergencyKeywords: false,
        riskFactorsApplied: [],
        priority: 'low',
        timeframe: 'as needed'
      };
    }

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

    // OPTIMIZED: Trigger worker notification asynchronously (don't wait)
    if (routingDecision.facility) {
      _sendWorkerNotificationAsync(
        routingDecision,
        userId,
        routingResult.rows[0].id,
        analysis.symptoms,
        severityAssessment.level,
        patientInfo
      ).catch(err => {
        logger.error('Async worker notification failed:', err);
      });
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

/**
 * Quick symptom detection without API call
 * @private
 */
function _quickSymptomDetection(message) {
  const commonSymptoms = [
    'fever', 'बुखार', 'cough', 'खांसी', 'headache', 'सिरदर्द',
    'pain', 'दर्द', 'cold', 'सर्दी', 'vomit', 'उल्टी',
    'diarrhea', 'दस्त', 'weakness', 'कमजोरी', 'dizzy', 'चक्कर',
    'breathing', 'सांस', 'chest', 'सीने', 'stomach', 'पेट'
  ];

  const detectedSymptoms = [];
  const lowerMessage = message.toLowerCase();

  for (const symptom of commonSymptoms) {
    if (lowerMessage.includes(symptom)) {
      detectedSymptoms.push(symptom);
    }
  }

  return {
    symptoms: detectedSymptoms,
    keywords: detectedSymptoms,
    confidence: detectedSymptoms.length > 0 ? 0.8 : 0.3
  };
}

/**
 * Quick severity assessment without API call
 * @private
 */
function _quickSeverityAssessment(message, symptoms, patientInfo) {
  const emergencyKeywords = [
    'chest pain', 'सीने में दर्द', 'difficulty breathing', 'सांस लेने में तकलीफ',
    'unconscious', 'बेहोश', 'severe bleeding', 'खून बह रहा',
    'heart attack', 'दिल का दौरा', 'stroke', 'seizure', 'दौरा'
  ];

  const lowerMessage = message.toLowerCase();
  let score = 20; // Base score

  // Check for emergency keywords
  for (const keyword of emergencyKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        score: 95,
        level: 'critical',
        emergencyKeywords: [keyword],
        reasoning: 'Emergency situation detected',
        recommendedFacility: 'EMERGENCY',
        timeframe: 'immediate'
      };
    }
  }

  // Score based on number of symptoms
  score += symptoms.length * 10;

  // Age adjustment
  if (patientInfo?.age) {
    if (patientInfo.age > 65 || patientInfo.age < 5) {
      score += 10;
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level
  let level = 'low';
  let facility = 'ASHA';
  let timeframe = 'as needed';

  if (score >= 61) {
    level = 'high';
    facility = 'CHC';
    timeframe = '4-24 hours';
  } else if (score >= 41) {
    level = 'medium';
    facility = 'PHC';
    timeframe = '24-48 hours';
  }

  return {
    score,
    level,
    emergencyKeywords: [],
    reasoning: `Severity assessed based on symptoms reported`,
    recommendedFacility: facility,
    timeframe
  };
}

/**
 * Send worker notification asynchronously
 * @private
 */
async function _sendWorkerNotificationAsync(
  routingDecision,
  userId,
  routingDecisionId,
  symptoms,
  severityLevel,
  patientInfo
) {
  try {
    const workerType = _mapFacilityToWorkerType(routingDecision.recommendedFacilityType);

    const worker = await notificationService.findAvailableWorker(
      workerType,
      patientInfo.location
    );

    if (worker) {
      const notificationResult = await notificationService.createNotification({
        workerId: worker.id,
        workerType,
        patientId: userId,
        routingDecisionId,
        symptoms,
        severity: severityLevel,
        patientInfo,
        facilityType: routingDecision.recommendedFacilityType
      });

      await notificationService.deliverNotification(
        notificationResult.notification.id,
        ['app', 'sms']
      );
    }
  } catch (error) {
    logger.error('Error in async worker notification:', error);
  }
}

module.exports = router;
