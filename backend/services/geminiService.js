const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini Service for Healthcare Voice Assistant
 * Handles all interactions with Google Gemini API including symptom analysis,
 * severity assessment, and healthcare response generation.
 */
class GeminiService {
  constructor() {
    this.client = null;
    this.model = null;
    this.config = {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash', // Flash is faster
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 500, // Reduced for faster responses
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
      maxRetries: 2, // Reduced retries for faster failure
      retryDelay: 500, // Reduced delay
    };

    this.systemPrompt = this._createHealthcareSystemPrompt();
    this._initialize();
  }

  /**
   * Initialize Gemini client with configuration
   */
  _initialize() {
    if (!this.config.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. AI analysis is unavailable.');
    }

    try {
      this.client = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        }
      });
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error.message);
    }
  }

  /**
   * Create healthcare-specific system prompt template
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
   * Check if service is initialized
   */
  isInitialized() {
    return this.model !== null;
  }

  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry logic with exponential backoff
   */
  async _retryWithBackoff(fn, attempt = 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      console.log(`Gemini API call failed (attempt ${attempt}/${this.config.maxRetries}). Retrying in ${delay}ms...`);

      await this._sleep(delay);
      return this._retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Analyze user symptoms using Gemini API
   */
  async analyzeSymptoms(userMessage, conversationHistory = [], userContext = {}) {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('Invalid user message');
    }

    if (!this.isInitialized()) {
      throw new Error('Gemini AI service not initialized');
    }

    try {
      const prompt = this._buildAnalysisPrompt(userMessage, conversationHistory, userContext);

      const result = await this._retryWithBackoff(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const text = response.text();

      console.log('Gemini analysis response:', text.substring(0, 500));

      let analysis;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in Gemini response');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        throw new Error('Failed to parse AI analysis response');
      }

      return {
        symptoms: analysis.symptoms || [],
        keywords: analysis.keywords || [],
        severityIndicators: analysis.severity_indicators || [],
        emergencyKeywords: analysis.emergency_keywords || [],
        clarifyingQuestions: analysis.clarifying_questions || [],
        initialAssessment: analysis.initial_assessment || '',
        confidence: analysis.confidence || 0.5,
      };
    } catch (error) {
      console.error('Gemini symptom analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Build analysis prompt
   */
  _buildAnalysisPrompt(userMessage, conversationHistory, userContext) {
    let prompt = this.systemPrompt + '\n\n';

    if (userContext.age) {
      prompt += `PATIENT AGE: ${userContext.age} years old\n`;
    }
    if (userContext.gender) {
      prompt += `PATIENT GENDER: ${userContext.gender}\n`;
    }
    if (userContext.medicalHistory && userContext.medicalHistory.length > 0) {
      prompt += `MEDICAL HISTORY: ${userContext.medicalHistory.join(', ')}\n`;
    }

    prompt += `\nUSER MESSAGE: ${userMessage}\n\n`;
    prompt += `IMPORTANT: You MUST respond with ONLY valid JSON in exactly this format, with no additional text before or after:

{
  "symptoms": ["list of identified symptoms"],
  "keywords": ["key medical terms mentioned"],
  "severity_indicators": ["indicators of severity like duration, intensity"],
  "emergency_keywords": ["any emergency keywords detected"],
  "clarifying_questions": ["questions to ask for better assessment"],
  "initial_assessment": "brief assessment of the situation",
  "confidence": 0.8
}

Do not include any explanatory text, markdown formatting, or code blocks. Return ONLY the raw JSON object.`;

    return prompt;
  }

  /**
   * Analyze image using Gemini Vision API
   * @param {string} imageData - Base64 encoded image
   * @param {string} userMessage - User's message about the image
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} userContext - User context
   * @returns {string} AI analysis of the image
   */
  async analyzeImageWithVision(imageData, userMessage, conversationHistory = [], userContext = {}) {
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image data');
    }

    if (!this.isInitialized()) {
      throw new Error('Gemini AI service not initialized');
    }

    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

      const prompt = this._buildImageAnalysisPrompt(userMessage, conversationHistory, userContext);

      const result = await this._retryWithBackoff(async () => {
        return await this.model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          }
        ]);
      });

      const response = result.response;
      const text = response.text();

      console.log('Gemini Vision analysis response:', text.substring(0, 500));

      return text;
    } catch (error) {
      console.error('Gemini Vision analysis error:', error);
      throw error;
    }
  }

  /**
   * Build image analysis prompt
   */
  _buildImageAnalysisPrompt(userMessage, conversationHistory, userContext) {
    let prompt = this.systemPrompt + '\n\n';
    prompt += 'IMAGE ANALYSIS MODE:\n';
    prompt += 'You are analyzing a medical image. Provide helpful health guidance based on what you see.\n\n';

    if (userContext.age) {
      prompt += `PATIENT AGE: ${userContext.age} years old\n`;
    }
    if (userContext.gender) {
      prompt += `PATIENT GENDER: ${userContext.gender}\n`;
    }

    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += '\nCONVERSATION HISTORY:\n';
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    prompt += `\nUSER MESSAGE: ${userMessage}\n\n`;
    prompt += `Analyze the image and provide:\n`;
    prompt += `1. What you see in the image (2-3 sentences)\n`;
    prompt += `2. If it's a medical condition (rash, wound, etc.), provide guidance\n`;
    prompt += `3. If it's a prescription or report, summarize key points\n`;
    prompt += `4. Recommend next steps\n\n`;
    prompt += `Keep response SHORT (3-5 sentences). Be helpful and clear.`;

    return prompt;
  }

  /**
   * Generate healthcare response
   */
  async generateHealthcareResponse(userMessage, conversationHistory = [], userContext = {}) {
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('Invalid user message');
    }

    if (!this.isInitialized()) {
      throw new Error('Gemini AI service not initialized');
    }

    try {
      const prompt = this._buildResponsePrompt(userMessage, conversationHistory, userContext);

      const result = await this._retryWithBackoff(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini response generation error:', error);
      throw error;
    }
  }

  /**
   * Build response prompt
   */
  _buildResponsePrompt(userMessage, conversationHistory, userContext) {
    let prompt = this.systemPrompt + '\n\n';

    if (userContext.age) {
      prompt += `PATIENT AGE: ${userContext.age} years old\n`;
    }
    if (userContext.gender) {
      prompt += `PATIENT GENDER: ${userContext.gender}\n`;
    }

    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += '\nCONVERSATION HISTORY:\n';
      conversationHistory.slice(-5).forEach(msg => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    prompt += `\nUSER MESSAGE: ${userMessage}\n\n`;
    prompt += `Respond in 2-4 sentences. Be helpful and concise. No long disclaimers.`;

    return prompt;
  }

  /**
   * Assess severity of symptoms
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

    if (!this.isInitialized()) {
      throw new Error('Gemini AI service not initialized');
    }

    try {
      const prompt = this._buildSeverityPrompt(symptoms, patientInfo);

      const result = await this._retryWithBackoff(async () => {
        return await this.model.generateContent(prompt);
      });

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const assessment = JSON.parse(jsonMatch[0]);

      let severityScore = assessment.severity_score || 50;
      severityScore = this._adjustSeverityForPatientFactors(severityScore, patientInfo);
      severityScore = Math.max(0, Math.min(100, severityScore));

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
    } catch (error) {
      console.error('Gemini severity assessment error:', error);
      throw error;
    }
  }

  /**
   * Build severity assessment prompt
   */
  _buildSeverityPrompt(symptoms, patientInfo) {
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

IMPORTANT: Respond with ONLY valid JSON in exactly this format, with no additional text:
{
  "severity_score": 50,
  "reasoning": "explanation here",
  "risk_factors": ["factor1", "factor2"],
  "red_flags": ["flag1", "flag2"]
}

Do not include any explanatory text, markdown formatting, or code blocks. Return ONLY the raw JSON object.`;

    return prompt;
  }

  /**
   * Detect emergency keywords
   */
  _detectEmergencyKeywords(symptoms) {
    const emergencyKeywords = [
      'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
      'seizure', 'severe head injury', 'poisoning', 'severe burn',
      'stroke', 'heart attack', 'cannot breathe', 'choking',
      'crushing chest pain', 'sudden weakness', 'sudden numbness',
      'severe abdominal pain', 'coughing blood', 'vomiting blood',
      'severe allergic reaction', 'anaphylaxis',
    ];

    const symptomsText = symptoms.join(' ').toLowerCase();
    return emergencyKeywords.filter(keyword =>
      symptomsText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Adjust severity for patient factors
   */
  _adjustSeverityForPatientFactors(baseScore, patientInfo) {
    let adjustedScore = baseScore;

    if (patientInfo.age) {
      if (patientInfo.age < 5 || patientInfo.age > 65) {
        adjustedScore += 5;
      }
      if (patientInfo.age > 75) {
        adjustedScore += 5;
      }
    }

    if (patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0) {
      const highRiskConditions = [
        'diabetes', 'hypertension', 'heart disease', 'asthma',
        'copd', 'kidney disease', 'liver disease', 'cancer',
      ];

      const hasHighRiskCondition = patientInfo.medicalHistory.some(condition =>
        highRiskConditions.some(risk =>
          condition.toLowerCase().includes(risk)
        )
      );

      if (hasHighRiskCondition) {
        adjustedScore += 10;
      }
    }

    if (patientInfo.isPregnant) {
      adjustedScore += 10;
    }

    return adjustedScore;
  }

  /**
   * Map severity score to level and facility
   */
  _mapSeverityToLevel(score) {
    if (score >= 81) {
      return { level: 'critical', facility: 'EMERGENCY', timeframe: 'immediate' };
    } else if (score >= 61) {
      return { level: 'high', facility: 'CHC', timeframe: '4-24 hours' };
    } else if (score >= 41) {
      return { level: 'medium', facility: 'PHC', timeframe: '24-48 hours' };
    } else {
      return { level: 'low', facility: 'ASHA', timeframe: '48 hours or as needed' };
    }
  }
}

module.exports = GeminiService;
