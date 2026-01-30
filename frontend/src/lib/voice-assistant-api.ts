// API client for Voice Healthcare Assistant

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface AnalyzeMessageRequest {
  userId: string;
  message: string;
  conversationId?: string;
  language?: string;
  patientInfo: {
    age?: number;
    gender?: string;
    location?: {
      lat: number;
      lng: number;
    };
    medicalHistory?: string[];
  };
}

export interface AnalyzeMessageResponse {
  success: boolean;
  response: string;
  routing: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    severityScore: number;
    facility?: FacilityInfo;
    facilityType: 'ASHA' | 'PHC' | 'CHC' | 'EMERGENCY';
    reasoning: string;
    priority: string;
    timeframe: string;
  };
  conversationId: string;
  messageId: string;
  error?: string;
}

export interface FacilityInfo {
  id: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  distance?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ConversationHistoryResponse {
  success: boolean;
  conversations: ConversationSummary[];
  total: number;
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  language: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  status: string;
}

export interface ConversationDetailResponse {
  success: boolean;
  conversation: ConversationDetail;
  error?: string;
}

export interface ConversationDetail {
  id: string;
  user_id: string;
  title: string;
  language: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  status: string;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

export interface FeedbackRequest {
  messageId: string;
  userId: string;
  rating: number;
  feedback?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback: any;
  error?: string;
}

/**
 * Voice Assistant API Client
 */
class VoiceAssistantAPI {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(baseUrl: string = API_BASE_URL, maxRetries: number = 3, retryDelay: number = 1000) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Analyze user message and get AI response with routing
   */
  async analyzeMessage(request: AnalyzeMessageRequest): Promise<AnalyzeMessageResponse> {
    return this.requestWithRetry<AnalyzeMessageResponse>(
      `${this.baseUrl}/voice-assistant/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    status: string = 'active'
  ): Promise<ConversationHistoryResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      status,
    });

    return this.request<ConversationHistoryResponse>(
      `${this.baseUrl}/voice-assistant/conversations/${userId}?${params}`
    );
  }

  /**
   * Get specific conversation with all messages
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationDetailResponse> {
    const params = new URLSearchParams({ userId });

    return this.request<ConversationDetailResponse>(
      `${this.baseUrl}/voice-assistant/conversation/${conversationId}?${params}`
    );
  }

  /**
   * Submit feedback on AI response
   */
  async submitFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    return this.request<FeedbackResponse>(
      `${this.baseUrl}/voice-assistant/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   */
  private async requestWithRetry<T>(
    url: string,
    options?: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await this.request<T>(url, options);
    } catch (error) {
      // Check if we should retry
      if (attempt < this.maxRetries) {
        // Calculate exponential backoff delay
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        
        console.log(`Retrying request (attempt ${attempt + 1}/${this.maxRetries}) after ${delay}ms`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return this.requestWithRetry<T>(url, options, attempt + 1);
      }

      // Max retries reached, throw error
      throw error;
    }
  }
}

// Export singleton instance
export const voiceAssistantAPI = new VoiceAssistantAPI();

// Export class for testing
export { VoiceAssistantAPI };
