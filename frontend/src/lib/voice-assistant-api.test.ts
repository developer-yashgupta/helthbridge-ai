import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VoiceAssistantAPI } from "./voice-assistant-api";

// Mock fetch
global.fetch = vi.fn();

describe("VoiceAssistantAPI", () => {
  let api: VoiceAssistantAPI;

  beforeEach(() => {
    api = new VoiceAssistantAPI("http://localhost:3000/api", 3, 100);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("analyzeMessage", () => {
    it("should successfully analyze a message", async () => {
      const mockResponse = {
        success: true,
        response: "आपको बुखार है। कृपया ASHA कार्यकर्ता से संपर्क करें।",
        routing: {
          severity: "low",
          severityScore: 30,
          facilityType: "ASHA",
          reasoning: "Low severity symptoms",
          priority: "routine",
          timeframe: "24 hours",
        },
        conversationId: "conv-123",
        messageId: "msg-456",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        userId: "user-123",
        message: "मुझे बुखार है",
        language: "hi",
        patientInfo: {
          age: 30,
          gender: "male",
        },
      };

      const result = await api.analyzeMessage(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/voice-assistant/analyze",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        })
      );
    });

    it("should retry on failure and succeed", async () => {
      const mockResponse = {
        success: true,
        response: "Test response",
        routing: {
          severity: "low",
          severityScore: 20,
          facilityType: "ASHA",
          reasoning: "Test",
          priority: "routine",
          timeframe: "24 hours",
        },
        conversationId: "conv-123",
        messageId: "msg-456",
      };

      // First call fails, second succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const request = {
        userId: "user-123",
        message: "test",
        language: "hi",
        patientInfo: {},
      };

      const result = await api.analyzeMessage(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should throw error after max retries", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const request = {
        userId: "user-123",
        message: "test",
        language: "hi",
        patientInfo: {},
      };

      await expect(api.analyzeMessage(request)).rejects.toThrow("Network error");
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should handle API error responses", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: "Invalid request",
        }),
      });

      const request = {
        userId: "user-123",
        message: "",
        language: "hi",
        patientInfo: {},
      };

      await expect(api.analyzeMessage(request)).rejects.toThrow("Invalid request");
    });
  });

  describe("getConversationHistory", () => {
    it("should fetch conversation history", async () => {
      const mockResponse = {
        success: true,
        conversations: [
          {
            id: "conv-1",
            title: "Fever consultation",
            language: "hi",
            started_at: "2024-01-01T10:00:00Z",
            last_message_at: "2024-01-01T10:30:00Z",
            message_count: 5,
            status: "active",
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.getConversationHistory("user-123", 20, 0, "active");

      expect(result).toEqual(mockResponse);
      const fetchCall = (global.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain("/voice-assistant/conversations/user-123");
    });
  });

  describe("getConversation", () => {
    it("should fetch specific conversation", async () => {
      const mockResponse = {
        success: true,
        conversation: {
          id: "conv-123",
          user_id: "user-123",
          title: "Test conversation",
          language: "hi",
          started_at: "2024-01-01T10:00:00Z",
          last_message_at: "2024-01-01T10:30:00Z",
          message_count: 3,
          status: "active",
          messages: [
            {
              id: "msg-1",
              conversation_id: "conv-123",
              role: "user",
              content: "Hello",
              created_at: "2024-01-01T10:00:00Z",
            },
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.getConversation("conv-123", "user-123");

      expect(result).toEqual(mockResponse);
      const fetchCall = (global.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain("/voice-assistant/conversation/conv-123");
    });
  });

  describe("submitFeedback", () => {
    it("should submit feedback successfully", async () => {
      const mockResponse = {
        success: true,
        feedback: {
          id: "feedback-123",
          message_id: "msg-456",
          rating: 5,
          feedback: "Very helpful",
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        messageId: "msg-456",
        userId: "user-123",
        rating: 5,
        feedback: "Very helpful",
      };

      const result = await api.submitFeedback(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/voice-assistant/feedback",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        })
      );
    });
  });
});
