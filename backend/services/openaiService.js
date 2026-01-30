const OpenAI = require('openai');

/**
 * OpenAI Service for Healthcare Voice Assistant
 * Handles all interactions with OpenAI API including symptom analysis,
 * severity assessment, and healthcare response generation.
 */
class OpenAIService {
  constructor() {
    this.client = null;
    this.config = {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      maxRetries: 3,
      retryDelay: 1000, // Initial delay in ms
    };

    this.systemPrompt = this._createHealthcareSystemPrompt();
    this._initialize();
  }

  /**
   * Initialize OpenAI client with configuration
   * @throws {Error} If API key is missing or invalid
   */
  _initialize() {
    if (!this.config.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    if (!this.config.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OPENAI_API_KEY format');
    }

    try {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
      });
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
    }
  }

  /**
   * Create healthcare-specific system prompt template
   * @returns {string} System prompt for healthcare assistant
   */
  _createHealthcareSystemPrompt() {
    return `You are a healthcare assistant for HealthBridge AI, a rural healthcare platform in India.

RESPONSE STYLE:
- Keep responses SHORT and CLEAR (2-4 sentences maximum)
- Be warm but concise
- Use simple language
- Get to the point quickly
- NO long disclaimers in every message

YOUR ROLE:
1. Listen to symptoms and ask clarifying questions
2. Assess severity and provide guidance
3. Route to appropriate care level (ASHA/PHC/CHC/Emergency)

SEVERITY LEVELS:
- LOW (0-40): ASHA worker or home care
- MEDIUM (41-60): PHC within 24-48 hours
- HIGH (61-80): CHC within 4-24 hours
- CRITICAL (81-100): Emergency - immediate attention

EMERGENCY KEYWORDS: chest pain, difficulty breathing, severe bleeding, unconscious, seizure, severe head injury, poisoning, severe burns, stroke symptoms, heart attack symptoms

IMPORTANT:
- Identify emergencies immediately
- Never diagnose definitively
- Be culturally sensitive
- Respond in user's language (Hindi/English/other Indian languages)
- Common rural issues: malaria, dengue, TB, diabetes, hypertension`;
  }

  /**
   * Retry logic with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} attempt - Current attempt number
   * @returns {Promise<any>} Result of the function
   */
  async _retryWithBackoff(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (!this._isRetryableError(error)) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      
      console.log(`OpenAI API call failed (attempt ${attempt}/${this.config.maxRetries}). Retrying in ${delay}ms...`);
      
      await this._sleep(delay);
      return this._retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retryable
   */
  _isRetryableError(error) {
    // Retry on network errors, timeouts, and rate limits
    const retryableErrors = [
      'econnreset',
      'etimedout',
      'enotfound',
      'rate_limit_exceeded',
      'timeout',
      'server_error',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    const statusCode = error.status || error.statusCode;

    // Retry on 5xx errors and 429 (rate limit)
    if (statusCode >= 500 || statusCode === 429) {
      return true;
    }

    // Check error message and code
    return retryableErrors.some(
      (retryable) => errorMessage.includes(retryable.toLowerCase()) || errorCode.includes(retryable.toLowerCase())
    );
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate OpenAI API response
   * @param {Object} response - OpenAI API response
   * @throws {Error} If response is invalid
   */
  _validateResponse(response) {
    if (!response) {
      throw new Error('Empty response from OpenAI API');
    }

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in OpenAI API response');
    }

    if (!response.choices[0].message || !response.choices[0].message.content) {
      throw new Error('No content in OpenAI API response');
    }
  }

  /**
   * Get configuration (for testing)
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      maxRetries: this.config.maxRetries,
    };
  }

  /**
   * Check if service is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.client !== null;
  }

  /**
   * Analyze user symptoms using OpenAI API
   * @param {string} userMessage - User's symptom description
   * @param {Array} conversationHistory - Previous messages in conversation
   * @param {Object} userContext - User context (age, gender, location, medical history)
   * @returns {Promise<Object>} Analysis result with symptoms, keywords, and initial assessment
   */
  async analyzeSymptoms(userMessage, conversationHistory = [], userContext = {}) {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('Invalid user message');
    }

    // Build conversation messages
    const messages = this._buildConversationMessages(
      userMessage,
      conversationHistory,
      userContext
    );

    // Call OpenAI API with retry logic
    const response = await this._retryWithBackoff(async () => {
      return await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      });
    });

    // Validate response
    this._validateResponse(response);

    // Parse and return analysis
    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content);

    return {
      symptoms: analysis.symptoms || [],
      keywords: analysis.keywords || [],
      severityIndicators: analysis.severity_indicators || [],
      emergencyKeywords: analysis.emergency_keywords || [],
      clarifyingQuestions: analysis.clarifying_questions || [],
      initialAssessment: analysis.initial_assessment || '',
      confidence: analysis.confidence || 0.5,
    };
  }

  /**
   * Build conversation messages for OpenAI API
   * @param {string} userMessage - Current user message
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} userContext - User context
   * @returns {Array} Formatted messages array
   */
  _buildConversationMessages(userMessage, conversationHistory, userContext) {
    const messages = [];

    // Add system prompt with user context
    const contextualPrompt = this._addUserContextToPrompt(userContext);
    messages.push({
      role: 'system',
      content: contextualPrompt,
    });

    // Add conversation history (limit to last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message with analysis instruction
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Add analysis instruction
    messages.push({
      role: 'system',
      content: `Analyze the user's message and provide a JSON response with the following structure:
{
  "symptoms": ["list of identified symptoms"],
  "keywords": ["key medical terms mentioned"],
  "severity_indicators": ["indicators of severity like duration, intensity"],
  "emergency_keywords": ["any emergency keywords detected"],
  "clarifying_questions": ["questions to ask for better assessment"],
  "initial_assessment": "brief assessment of the situation",
  "confidence": 0.0-1.0
}`,
    });

    return messages;
  }

  /**
   * Add user context to system prompt
   * @param {Object} userContext - User context information
   * @returns {string} Enhanced system prompt
   */
  _addUserContextToPrompt(userContext) {
    let contextualPrompt = this.systemPrompt;

    if (userContext.age) {
      contextualPrompt += `\n\nPATIENT AGE: ${userContext.age} years old`;
    }

    if (userContext.gender) {
      contextualPrompt += `\nPATIENT GENDER: ${userContext.gender}`;
    }

    if (userContext.medicalHistory && userContext.medicalHistory.length > 0) {
      contextualPrompt += `\nMEDICAL HISTORY: ${userContext.medicalHistory.join(', ')}`;
    }

    if (userContext.location) {
      contextualPrompt += `\nLOCATION: ${userContext.location.state || 'India'}`;
    }

    return contextualPrompt;
  }

  /**
   * Generate healthcare response with streaming support
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} userContext - User context
   * @param {Function} onChunk - Callback for streaming chunks (optional)
   * @returns {Promise<string>} Generated response
   */
  async generateHealthcareResponse(userMessage, conversationHistory = [], userContext = {}, onChunk = null) {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('Invalid user message');
    }

    // Build conversation messages
    const messages = this._buildConversationMessages(
      userMessage,
      conversationHistory,
      userContext
    );

    // Remove the analysis instruction for response generation
    messages.pop();

    if (onChunk && typeof onChunk === 'function') {
      // Streaming response
      return await this._streamResponse(messages, onChunk);
    } else {
      // Non-streaming response
      const response = await this._retryWithBackoff(async () => {
        return await this.client.chat.completions.create({
          model: this.config.model,
          messages: messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        });
      });

      this._validateResponse(response);
      return response.choices[0].message.content;
    }
  }

  /**
   * Stream response from OpenAI API
   * @param {Array} messages - Conversation messages
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Complete response
   */
  async _streamResponse(messages, onChunk) {
    const stream = await this._retryWithBackoff(async () => {
      return await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      });
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  }

  /**
   * Extract symptom keywords from text
   * @param {string} text - Text to analyze
   * @returns {Array<string>} Extracted keywords
   */
  extractSymptomKeywords(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Common symptom keywords in English and Hindi (transliterated)
    const symptomKeywords = [
      'fever', 'bukhar', 'pain', 'dard', 'cough', 'khansi',
      'headache', 'sir dard', 'vomiting', 'ulti', 'diarrhea', 'dast',
      'weakness', 'kamzori', 'dizziness', 'chakkar', 'bleeding', 'khoon',
      'breathing', 'saans', 'chest', 'chati', 'stomach', 'pet',
      'nausea', 'jee machalna', 'fatigue', 'thakan', 'rash', 'daane',
      'swelling', 'sujan', 'injury', 'chot', 'burn', 'jalna',
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = symptomKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    );

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  /**
   * Assess severity of symptoms (0-100 scale)
   * @param {Array<string>} symptoms - List of symptoms
   * @param {Object} patientInfo - Patient information (age, gender, medical history)
   * @returns {Promise<Object>} Severity assessment with score, level, and reasoning
   */
  async assessSeverity(symptoms, patientInfo = {}) {
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      throw new Error('Invalid symptoms array');
    }

    // Detect emergency keywords first
    const emergencyKeywords = this._detectEmergencyKeywords(symptoms);
    
    if (emergencyKeywords.length > 0) {
      return {
        score: 95,
        level: 'critical',
        emergencyKeywords: emergencyKeywords,
        reasoning: `Emergency situation detected: ${emergencyKeywords.join(', ')}. Immediate medical attention required.`,
        recommendedFacility: 'EMERGENCY',
        timeframe: 'immediate',
      };
    }

    // Build assessment prompt
    const assessmentPrompt = this._buildSeverityAssessmentPrompt(symptoms, patientInfo);

    // Call OpenAI for severity assessment
    const response = await this._retryWithBackoff(async () => {
      return await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt,
          },
          {
            role: 'user',
            content: assessmentPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent severity scoring
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
    });

    this._validateResponse(response);

    // Parse severity assessment
    const content = response.choices[0].message.content;
    const assessment = JSON.parse(content);

    // Calculate final severity score with adjustments
    let severityScore = assessment.severity_score || 50;
    severityScore = this._adjustSeverityForPatientFactors(severityScore, patientInfo);

    // Ensure score is within bounds
    severityScore = Math.max(0, Math.min(100, severityScore));

    // Map score to level and facility
    const { level, facility, timeframe } = this._mapSeverityToLevel(severityScore);

    return {
      score: severityScore,
      level: level,
      emergencyKeywords: [],
      reasoning: assessment.reasoning || 'Assessment based on reported symptoms',
      recommendedFacility: facility,
      timeframe: timeframe,
      riskFactors: assessment.risk_factors || [],
      redFlags: assessment.red_flags || [],
    };
  }

  /**
   * Detect emergency keywords in symptoms
   * @param {Array<string>} symptoms - List of symptoms
   * @returns {Array<string>} Detected emergency keywords
   */
  _detectEmergencyKeywords(symptoms) {
    const emergencyKeywords = [
      'chest pain', 'chati mein dard', 'difficulty breathing', 'saans lene mein takleef',
      'severe bleeding', 'bahut khoon', 'unconscious', 'behosh',
      'seizure', 'daura', 'severe head injury', 'sir mein chot',
      'poisoning', 'zeher', 'severe burn', 'jalan',
      'stroke', 'paralysis', 'lakwa', 'heart attack', 'dil ka daura',
      'cannot breathe', 'choking', 'dum ghut raha',
      'severe chest pain', 'crushing chest pain',
      'sudden weakness', 'sudden numbness',
      'severe abdominal pain', 'pet mein bahut dard',
      'coughing blood', 'khoon ki ulti', 'vomiting blood',
      'severe allergic reaction', 'anaphylaxis',
    ];

    const symptomsText = symptoms.join(' ').toLowerCase();
    const detected = emergencyKeywords.filter((keyword) =>
      symptomsText.includes(keyword.toLowerCase())
    );

    return detected;
  }

  /**
   * Build severity assessment prompt
   * @param {Array<string>} symptoms - List of symptoms
   * @param {Object} patientInfo - Patient information
   * @returns {string} Assessment prompt
   */
  _buildSeverityAssessmentPrompt(symptoms, patientInfo) {
    let prompt = `Assess the severity of the following symptoms on a scale of 0-100:\n\n`;
    prompt += `SYMPTOMS: ${symptoms.join(', ')}\n\n`;

    if (patientInfo.age) {
      prompt += `PATIENT AGE: ${patientInfo.age} years\n`;
    }

    if (patientInfo.gender) {
      prompt += `PATIENT GENDER: ${patientInfo.gender}\n`;
    }

    if (patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0) {
      prompt += `MEDICAL HISTORY: ${patientInfo.medicalHistory.join(', ')}\n`;
    }

    prompt += `\nProvide a JSON response with the following structure:
{
  "severity_score": 0-100,
  "reasoning": "explanation of the severity assessment",
  "risk_factors": ["list of risk factors that increase severity"],
  "red_flags": ["warning signs that require immediate attention"]
}

SEVERITY SCORING GUIDELINES:
- 0-40 (LOW): Minor symptoms, self-care or ASHA worker consultation
- 41-60 (MEDIUM): Moderate symptoms, PHC visit recommended within 24-48 hours
- 61-80 (HIGH): Serious symptoms, CHC visit needed within 4-24 hours
- 81-100 (CRITICAL): Life-threatening, emergency services required immediately

Consider:
1. Symptom severity and duration
2. Patient age and vulnerability
3. Pre-existing medical conditions
4. Potential complications
5. Rural healthcare context in India`;

    return prompt;
  }

  /**
   * Adjust severity score based on patient factors
   * @param {number} baseScore - Base severity score
   * @param {Object} patientInfo - Patient information
   * @returns {number} Adjusted severity score
   */
  _adjustSeverityForPatientFactors(baseScore, patientInfo) {
    let adjustedScore = baseScore;

    // Age adjustments
    if (patientInfo.age) {
      if (patientInfo.age < 5 || patientInfo.age > 65) {
        // Increase severity for very young or elderly
        adjustedScore += 5;
      }
      if (patientInfo.age > 75) {
        // Additional increase for very elderly
        adjustedScore += 5;
      }
    }

    // Medical history adjustments
    if (patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0) {
      const highRiskConditions = [
        'diabetes', 'hypertension', 'heart disease', 'asthma',
        'copd', 'kidney disease', 'liver disease', 'cancer',
        'immunocompromised', 'hiv', 'tuberculosis',
      ];

      const hasHighRiskCondition = patientInfo.medicalHistory.some((condition) =>
        highRiskConditions.some((risk) =>
          condition.toLowerCase().includes(risk)
        )
      );

      if (hasHighRiskCondition) {
        adjustedScore += 10;
      }
    }

    // Pregnancy adjustment
    if (patientInfo.isPregnant) {
      adjustedScore += 10;
    }

    return adjustedScore;
  }

  /**
   * Map severity score to level and recommended facility
   * @param {number} score - Severity score (0-100)
   * @returns {Object} Level, facility, and timeframe
   */
  _mapSeverityToLevel(score) {
    if (score >= 81) {
      return {
        level: 'critical',
        facility: 'EMERGENCY',
        timeframe: 'immediate',
      };
    } else if (score >= 61) {
      return {
        level: 'high',
        facility: 'CHC',
        timeframe: '4-24 hours',
      };
    } else if (score >= 41) {
      return {
        level: 'medium',
        facility: 'PHC',
        timeframe: '24-48 hours',
      };
    } else {
      return {
        level: 'low',
        facility: 'ASHA',
        timeframe: '48 hours or as needed',
      };
    }
  }
}

module.exports = OpenAIService;
