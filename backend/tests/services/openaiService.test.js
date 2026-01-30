const OpenAIService = require('../../services/openaiService');

// Mock OpenAI module
jest.mock('openai');
const OpenAI = require('openai');

describe('OpenAIService - Initialization and Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set default test environment variables
    process.env.OPENAI_API_KEY = 'sk-test-key-123456789';
    process.env.OPENAI_MODEL = 'gpt-4';
    process.env.OPENAI_MAX_TOKENS = '1000';
    process.env.OPENAI_TEMPERATURE = '0.7';

    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock OpenAI constructor
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    }));
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Constructor and Initialization', () => {
    test('should initialize successfully with valid API key', () => {
      const service = new OpenAIService();
      
      expect(service.isInitialized()).toBe(true);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test-key-123456789',
      });
    });

    test('should throw error if API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => new OpenAIService()).toThrow(
        'OPENAI_API_KEY is not configured in environment variables'
      );
    });

    test('should throw error if API key format is invalid', () => {
      process.env.OPENAI_API_KEY = 'invalid-key-format';
      
      expect(() => new OpenAIService()).toThrow('Invalid OPENAI_API_KEY format');
    });

    test('should use default values for optional configuration', () => {
      delete process.env.OPENAI_MODEL;
      delete process.env.OPENAI_MAX_TOKENS;
      delete process.env.OPENAI_TEMPERATURE;
      
      const service = new OpenAIService();
      const config = service.getConfig();
      
      expect(config.model).toBe('gpt-4');
      expect(config.maxTokens).toBe(1000);
      expect(config.temperature).toBe(0.7);
      expect(config.maxRetries).toBe(3);
    });

    test('should use custom configuration from environment', () => {
      process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
      process.env.OPENAI_MAX_TOKENS = '500';
      process.env.OPENAI_TEMPERATURE = '0.5';
      
      const service = new OpenAIService();
      const config = service.getConfig();
      
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.maxTokens).toBe(500);
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('Healthcare System Prompt', () => {
    test('should create healthcare-specific system prompt', () => {
      const service = new OpenAIService();
      
      expect(service.systemPrompt).toBeDefined();
      expect(service.systemPrompt).toContain('healthcare assistant');
      expect(service.systemPrompt).toContain('HealthBridge AI');
      expect(service.systemPrompt).toContain('ANALYZE SYMPTOMS');
      expect(service.systemPrompt).toContain('ASSESS SEVERITY');
      expect(service.systemPrompt).toContain('ASHA worker');
      expect(service.systemPrompt).toContain('PHC');
      expect(service.systemPrompt).toContain('CHC');
      expect(service.systemPrompt).toContain('Emergency');
    });

    test('should include severity level guidelines in prompt', () => {
      const service = new OpenAIService();
      
      expect(service.systemPrompt).toContain('LOW (0-40)');
      expect(service.systemPrompt).toContain('MEDIUM (41-60)');
      expect(service.systemPrompt).toContain('HIGH (61-80)');
      expect(service.systemPrompt).toContain('CRITICAL (81-100)');
    });

    test('should include emergency keywords in prompt', () => {
      const service = new OpenAIService();
      
      expect(service.systemPrompt).toContain('chest pain');
      expect(service.systemPrompt).toContain('difficulty breathing');
      expect(service.systemPrompt).toContain('severe bleeding');
      expect(service.systemPrompt).toContain('unconscious');
    });

    test('should include cultural sensitivity guidelines', () => {
      const service = new OpenAIService();
      
      expect(service.systemPrompt).toContain('culturally sensitive');
      expect(service.systemPrompt).toContain('rural');
      expect(service.systemPrompt).toContain('India');
    });
  });

  describe('Error Handling - Retryable Errors', () => {
    test('should identify network errors as retryable', () => {
      const service = new OpenAIService();
      
      const networkError = new Error('ECONNRESET');
      expect(service._isRetryableError(networkError)).toBe(true);
      
      const timeoutError = new Error('ETIMEDOUT');
      expect(service._isRetryableError(timeoutError)).toBe(true);
    });

    test('should identify rate limit errors as retryable', () => {
      const service = new OpenAIService();
      
      const rateLimitError = { status: 429, message: 'Rate limit exceeded' };
      expect(service._isRetryableError(rateLimitError)).toBe(true);
    });

    test('should identify server errors (5xx) as retryable', () => {
      const service = new OpenAIService();
      
      const serverError = { status: 500, message: 'Internal server error' };
      expect(service._isRetryableError(serverError)).toBe(true);
      
      const serviceUnavailable = { status: 503, message: 'Service unavailable' };
      expect(service._isRetryableError(serviceUnavailable)).toBe(true);
    });

    test('should not retry client errors (4xx except 429)', () => {
      const service = new OpenAIService();
      
      const badRequest = { status: 400, message: 'Bad request' };
      expect(service._isRetryableError(badRequest)).toBe(false);
      
      const unauthorized = { status: 401, message: 'Unauthorized' };
      expect(service._isRetryableError(unauthorized)).toBe(false);
      
      const notFound = { status: 404, message: 'Not found' };
      expect(service._isRetryableError(notFound)).toBe(false);
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    test('should retry failed requests with exponential backoff', async () => {
      const service = new OpenAIService();
      let attemptCount = 0;
      
      const mockFn = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('ETIMEDOUT');
          throw error;
        }
        return 'success';
      });

      const result = await service._retryWithBackoff(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries exceeded', async () => {
      const service = new OpenAIService();
      
      const mockFn = jest.fn().mockImplementation(() => {
        throw { status: 500, message: 'Server error' };
      });

      await expect(service._retryWithBackoff(mockFn)).rejects.toMatchObject({
        status: 500,
      });
      
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should not retry non-retryable errors', async () => {
      const service = new OpenAIService();
      
      const mockFn = jest.fn().mockImplementation(() => {
        throw { status: 400, message: 'Bad request' };
      });

      await expect(service._retryWithBackoff(mockFn)).rejects.toMatchObject({
        status: 400,
      });
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should use exponential backoff delays', async () => {
      const service = new OpenAIService();
      const sleepSpy = jest.spyOn(service, '_sleep').mockResolvedValue();
      let attemptCount = 0;
      
      const mockFn = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw { status: 503, message: 'Service unavailable' };
        }
        return 'success';
      });

      await service._retryWithBackoff(mockFn);
      
      // First retry: 1000ms, Second retry: 2000ms
      expect(sleepSpy).toHaveBeenCalledWith(1000);
      expect(sleepSpy).toHaveBeenCalledWith(2000);
      
      sleepSpy.mockRestore();
    });
  });

  describe('Response Validation', () => {
    test('should validate successful response', () => {
      const service = new OpenAIService();
      
      const validResponse = {
        choices: [
          {
            message: {
              content: 'This is a valid response',
            },
          },
        ],
      };

      expect(() => service._validateResponse(validResponse)).not.toThrow();
    });

    test('should throw error for empty response', () => {
      const service = new OpenAIService();
      
      expect(() => service._validateResponse(null)).toThrow(
        'Empty response from OpenAI API'
      );
    });

    test('should throw error for response without choices', () => {
      const service = new OpenAIService();
      
      const invalidResponse = { id: 'test' };
      expect(() => service._validateResponse(invalidResponse)).toThrow(
        'No choices in OpenAI API response'
      );
    });

    test('should throw error for response with empty choices', () => {
      const service = new OpenAIService();
      
      const invalidResponse = { choices: [] };
      expect(() => service._validateResponse(invalidResponse)).toThrow(
        'No choices in OpenAI API response'
      );
    });

    test('should throw error for response without content', () => {
      const service = new OpenAIService();
      
      const invalidResponse = {
        choices: [{ message: {} }],
      };
      expect(() => service._validateResponse(invalidResponse)).toThrow(
        'No content in OpenAI API response'
      );
    });
  });

  describe('Utility Methods', () => {
    test('should sleep for specified duration', async () => {
      const service = new OpenAIService();
      const startTime = Date.now();
      
      await service._sleep(100);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
      expect(elapsed).toBeLessThan(150);
    });

    test('should return configuration object', () => {
      const service = new OpenAIService();
      const config = service.getConfig();
      
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('maxRetries');
    });

    test('should check initialization status', () => {
      const service = new OpenAIService();
      
      expect(service.isInitialized()).toBe(true);
    });
  });
});


describe('OpenAIService - Symptom Analysis', () => {
  let service;
  let mockCreate;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test-key-123456789';
    process.env.OPENAI_MODEL = 'gpt-4';
    
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    service = new OpenAIService();
  });

  describe('analyzeSymptoms', () => {
    test('should analyze symptoms successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                symptoms: ['fever', 'headache', 'body pain'],
                keywords: ['fever', 'headache', 'pain'],
                severity_indicators: ['high fever', '3 days duration'],
                emergency_keywords: [],
                clarifying_questions: ['Do you have any difficulty breathing?'],
                initial_assessment: 'Possible viral infection',
                confidence: 0.8,
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.analyzeSymptoms(
        'I have fever and headache for 3 days',
        [],
        { age: 35, gender: 'male' }
      );

      expect(result.symptoms).toEqual(['fever', 'headache', 'body pain']);
      expect(result.keywords).toEqual(['fever', 'headache', 'pain']);
      expect(result.confidence).toBe(0.8);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          response_format: { type: 'json_object' },
        })
      );
    });

    test('should include conversation history in analysis', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                symptoms: ['fever'],
                keywords: ['fever'],
                severity_indicators: [],
                emergency_keywords: [],
                clarifying_questions: [],
                initial_assessment: 'Monitoring required',
                confidence: 0.7,
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user', content: 'I had fever yesterday' },
        { role: 'assistant', content: 'How are you feeling today?' },
      ];

      await service.analyzeSymptoms('Still have fever', conversationHistory);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(2);
      expect(callArgs.messages.some((m) => m.content === 'I had fever yesterday')).toBe(true);
    });

    test('should include user context in system prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                symptoms: ['chest pain'],
                keywords: ['chest', 'pain'],
                severity_indicators: ['severe'],
                emergency_keywords: ['chest pain'],
                clarifying_questions: [],
                initial_assessment: 'Emergency situation',
                confidence: 0.9,
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const userContext = {
        age: 65,
        gender: 'male',
        medicalHistory: ['diabetes', 'hypertension'],
        location: { state: 'Maharashtra' },
      };

      await service.analyzeSymptoms('I have chest pain', [], userContext);

      const callArgs = mockCreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;
      
      expect(systemMessage).toContain('65 years old');
      expect(systemMessage).toContain('male');
      expect(systemMessage).toContain('diabetes');
      expect(systemMessage).toContain('hypertension');
    });

    test('should throw error for invalid user message', async () => {
      await expect(service.analyzeSymptoms('')).rejects.toThrow('Invalid user message');
      await expect(service.analyzeSymptoms(null)).rejects.toThrow('Invalid user message');
      await expect(service.analyzeSymptoms(123)).rejects.toThrow('Invalid user message');
    });

    test('should handle API errors with retry', async () => {
      let attemptCount = 0;
      mockCreate.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw { status: 500, message: 'Server error' };
        }
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  symptoms: ['fever'],
                  keywords: ['fever'],
                  severity_indicators: [],
                  emergency_keywords: [],
                  clarifying_questions: [],
                  initial_assessment: 'Mild condition',
                  confidence: 0.6,
                }),
              },
            },
          ],
        };
      });

      const result = await service.analyzeSymptoms('I have fever');
      
      expect(result.symptoms).toEqual(['fever']);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    test('should limit conversation history to last 10 messages', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                symptoms: [],
                keywords: [],
                severity_indicators: [],
                emergency_keywords: [],
                clarifying_questions: [],
                initial_assessment: '',
                confidence: 0.5,
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Create 15 messages in history
      const conversationHistory = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      await service.analyzeSymptoms('Current message', conversationHistory);

      const callArgs = mockCreate.mock.calls[0][0];
      // System prompt + 10 history messages + current message + analysis instruction
      expect(callArgs.messages.length).toBeLessThanOrEqual(13);
    });
  });

  describe('generateHealthcareResponse', () => {
    test('should generate healthcare response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Based on your symptoms, I recommend visiting a doctor.',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.generateHealthcareResponse(
        'What should I do about my fever?'
      );

      expect(result).toBe('Based on your symptoms, I recommend visiting a doctor.');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
      // Verify stream is not set
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.stream).toBeUndefined();
    });

    test('should support streaming responses', async () => {
      const chunks = ['Based ', 'on your ', 'symptoms, ', 'rest is needed.'];
      const mockStream = (async function* () {
        for (const chunk of chunks) {
          yield {
            choices: [{ delta: { content: chunk } }],
          };
        }
      })();

      mockCreate.mockResolvedValue(mockStream);

      const receivedChunks = [];
      const onChunk = (chunk) => receivedChunks.push(chunk);

      const result = await service.generateHealthcareResponse(
        'What should I do?',
        [],
        {},
        onChunk
      );

      expect(result).toBe('Based on your symptoms, rest is needed.');
      expect(receivedChunks).toEqual(chunks);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
        })
      );
    });

    test('should throw error for invalid message', async () => {
      await expect(service.generateHealthcareResponse('')).rejects.toThrow(
        'Invalid user message'
      );
    });
  });

  describe('extractSymptomKeywords', () => {
    test('should extract English symptom keywords', () => {
      const text = 'I have fever, headache, and cough';
      const keywords = service.extractSymptomKeywords(text);

      expect(keywords).toContain('fever');
      expect(keywords).toContain('headache');
      expect(keywords).toContain('cough');
    });

    test('should extract Hindi symptom keywords', () => {
      const text = 'Mujhe bukhar aur sir dard hai';
      const keywords = service.extractSymptomKeywords(text);

      expect(keywords).toContain('bukhar');
      expect(keywords).toContain('sir dard');
    });

    test('should be case insensitive', () => {
      const text = 'I have FEVER and HEADACHE';
      const keywords = service.extractSymptomKeywords(text);

      expect(keywords).toContain('fever');
      expect(keywords).toContain('headache');
    });

    test('should remove duplicate keywords', () => {
      const text = 'fever fever fever';
      const keywords = service.extractSymptomKeywords(text);

      expect(keywords).toEqual(['fever']);
    });

    test('should return empty array for invalid input', () => {
      expect(service.extractSymptomKeywords('')).toEqual([]);
      expect(service.extractSymptomKeywords(null)).toEqual([]);
      expect(service.extractSymptomKeywords(undefined)).toEqual([]);
    });

    test('should return empty array when no keywords found', () => {
      const text = 'Hello, how are you?';
      const keywords = service.extractSymptomKeywords(text);

      expect(keywords).toEqual([]);
    });
  });
});


describe('OpenAIService - Severity Assessment', () => {
  let service;
  let mockCreate;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test-key-123456789';
    process.env.OPENAI_MODEL = 'gpt-4';
    
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    service = new OpenAIService();
  });

  describe('assessSeverity', () => {
    test('should assess low severity symptoms', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 30,
                reasoning: 'Mild symptoms that can be managed with home care',
                risk_factors: [],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['mild headache', 'slight fever'],
        { age: 30, gender: 'male' }
      );

      expect(result.score).toBeLessThanOrEqual(40);
      expect(result.level).toBe('low');
      expect(result.recommendedFacility).toBe('ASHA');
      expect(result.timeframe).toBe('48 hours or as needed');
    });

    test('should assess medium severity symptoms', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 50,
                reasoning: 'Moderate symptoms requiring medical evaluation',
                risk_factors: ['persistent fever'],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['fever for 3 days', 'body pain', 'fatigue'],
        { age: 40, gender: 'female' }
      );

      expect(result.score).toBeGreaterThanOrEqual(41);
      expect(result.score).toBeLessThanOrEqual(60);
      expect(result.level).toBe('medium');
      expect(result.recommendedFacility).toBe('PHC');
      expect(result.timeframe).toBe('24-48 hours');
    });

    test('should assess high severity symptoms', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 70,
                reasoning: 'Serious symptoms requiring urgent medical attention',
                risk_factors: ['high fever', 'dehydration'],
                red_flags: ['persistent vomiting'],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['high fever', 'severe vomiting', 'dehydration'],
        { age: 5, gender: 'male' }
      );

      expect(result.score).toBeGreaterThanOrEqual(61);
      expect(result.score).toBeLessThanOrEqual(80);
      expect(result.level).toBe('high');
      expect(result.recommendedFacility).toBe('CHC');
      expect(result.timeframe).toBe('4-24 hours');
    });

    test('should detect emergency keywords and return critical severity', async () => {
      const result = await service.assessSeverity(
        ['chest pain', 'difficulty breathing'],
        { age: 60, gender: 'male' }
      );

      expect(result.score).toBeGreaterThanOrEqual(81);
      expect(result.level).toBe('critical');
      expect(result.recommendedFacility).toBe('EMERGENCY');
      expect(result.timeframe).toBe('immediate');
      expect(result.emergencyKeywords.length).toBeGreaterThan(0);
      expect(mockCreate).not.toHaveBeenCalled(); // Should not call API for emergencies
    });

    test('should detect Hindi emergency keywords', async () => {
      const result = await service.assessSeverity(
        ['chati mein dard', 'saans lene mein takleef'],
        { age: 55, gender: 'female' }
      );

      expect(result.level).toBe('critical');
      expect(result.emergencyKeywords.length).toBeGreaterThan(0);
    });

    test('should adjust severity for elderly patients', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 35,
                reasoning: 'Mild symptoms but age is a concern',
                risk_factors: ['elderly'],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['mild fever', 'cough'],
        { age: 75, gender: 'male' }
      );

      // Base score 35 + 5 (age > 65) + 5 (age > 75) = 45
      expect(result.score).toBeGreaterThan(35);
      // Score should be adjusted upward due to age
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    test('should adjust severity for young children', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 35,
                reasoning: 'Symptoms in young child require attention',
                risk_factors: ['young age'],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['fever', 'vomiting'],
        { age: 3, gender: 'female' }
      );

      // Base score 35 + 5 (age < 5) = 40
      expect(result.score).toBeGreaterThan(35);
    });

    test('should adjust severity for patients with medical history', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 45,
                reasoning: 'Pre-existing conditions increase risk',
                risk_factors: ['diabetes', 'hypertension'],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['fever', 'weakness'],
        {
          age: 55,
          gender: 'male',
          medicalHistory: ['diabetes', 'hypertension'],
        }
      );

      // Base score 45 + 10 (high risk conditions) = 55
      expect(result.score).toBeGreaterThan(45);
      expect(result.level).toBe('medium');
    });

    test('should adjust severity for pregnant patients', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 40,
                reasoning: 'Pregnancy requires extra caution',
                risk_factors: ['pregnancy'],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['fever', 'nausea'],
        {
          age: 28,
          gender: 'female',
          isPregnant: true,
        }
      );

      // Base score 40 + 10 (pregnancy) = 50
      expect(result.score).toBe(50);
      expect(result.level).toBe('medium');
    });

    test('should throw error for invalid symptoms', async () => {
      await expect(service.assessSeverity([])).rejects.toThrow('Invalid symptoms array');
      await expect(service.assessSeverity(null)).rejects.toThrow('Invalid symptoms array');
      await expect(service.assessSeverity('fever')).rejects.toThrow('Invalid symptoms array');
    });

    test('should cap severity score at 100', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 95,
                reasoning: 'Very severe symptoms',
                risk_factors: [],
                red_flags: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['severe symptoms'],
        {
          age: 80,
          gender: 'male',
          medicalHistory: ['diabetes', 'heart disease'],
          isPregnant: false,
        }
      );

      // Base 95 + 10 (age) + 10 (medical history) = 115, capped at 100
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should include risk factors and red flags in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                severity_score: 55,
                reasoning: 'Moderate symptoms with risk factors',
                risk_factors: ['prolonged fever', 'dehydration risk'],
                red_flags: ['persistent symptoms'],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await service.assessSeverity(
        ['fever for 5 days', 'reduced fluid intake'],
        { age: 45, gender: 'male' }
      );

      expect(result.riskFactors).toEqual(['prolonged fever', 'dehydration risk']);
      expect(result.redFlags).toEqual(['persistent symptoms']);
    });
  });

  describe('_detectEmergencyKeywords', () => {
    test('should detect English emergency keywords', () => {
      const symptoms = ['chest pain', 'difficulty breathing'];
      const keywords = service._detectEmergencyKeywords(symptoms);

      expect(keywords).toContain('chest pain');
      expect(keywords).toContain('difficulty breathing');
    });

    test('should detect Hindi emergency keywords', () => {
      const symptoms = ['chati mein dard', 'behosh'];
      const keywords = service._detectEmergencyKeywords(symptoms);

      expect(keywords.length).toBeGreaterThan(0);
    });

    test('should be case insensitive', () => {
      const symptoms = ['CHEST PAIN', 'SEVERE BLEEDING'];
      const keywords = service._detectEmergencyKeywords(symptoms);

      expect(keywords.length).toBeGreaterThan(0);
    });

    test('should return empty array when no emergency keywords', () => {
      const symptoms = ['mild headache', 'slight cough'];
      const keywords = service._detectEmergencyKeywords(symptoms);

      expect(keywords).toEqual([]);
    });
  });

  describe('_mapSeverityToLevel', () => {
    test('should map score 0-40 to low/ASHA', () => {
      const result = service._mapSeverityToLevel(30);
      
      expect(result.level).toBe('low');
      expect(result.facility).toBe('ASHA');
      expect(result.timeframe).toBe('48 hours or as needed');
    });

    test('should map score 41-60 to medium/PHC', () => {
      const result = service._mapSeverityToLevel(50);
      
      expect(result.level).toBe('medium');
      expect(result.facility).toBe('PHC');
      expect(result.timeframe).toBe('24-48 hours');
    });

    test('should map score 61-80 to high/CHC', () => {
      const result = service._mapSeverityToLevel(70);
      
      expect(result.level).toBe('high');
      expect(result.facility).toBe('CHC');
      expect(result.timeframe).toBe('4-24 hours');
    });

    test('should map score 81-100 to critical/EMERGENCY', () => {
      const result = service._mapSeverityToLevel(90);
      
      expect(result.level).toBe('critical');
      expect(result.facility).toBe('EMERGENCY');
      expect(result.timeframe).toBe('immediate');
    });

    test('should handle boundary values correctly', () => {
      expect(service._mapSeverityToLevel(40).level).toBe('low');
      expect(service._mapSeverityToLevel(41).level).toBe('medium');
      expect(service._mapSeverityToLevel(60).level).toBe('medium');
      expect(service._mapSeverityToLevel(61).level).toBe('high');
      expect(service._mapSeverityToLevel(80).level).toBe('high');
      expect(service._mapSeverityToLevel(81).level).toBe('critical');
    });
  });
});
