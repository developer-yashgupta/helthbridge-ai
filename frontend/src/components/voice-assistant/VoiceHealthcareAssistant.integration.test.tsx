import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceHealthcareAssistant from "./VoiceHealthcareAssistant";
import * as voiceAssistantAPI from "@/lib/voice-assistant-api";

// Mock child components
vi.mock("./VoiceInput", () => ({
  default: ({ onTranscript }: any) => (
    <div data-testid="voice-input">
      <button onClick={() => onTranscript("test")}>Record</button>
    </div>
  ),
}));

vi.mock("./VoiceOutput", () => ({
  default: () => <div data-testid="voice-output" />,
}));

vi.mock("./ConversationDisplay", () => ({
  default: ({ messages }: any) => (
    <div data-testid="conversation-display">
      {messages.map((msg: any) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  ),
}));

vi.mock("./VoiceOutputPreferences", () => ({
  default: () => <div data-testid="voice-preferences" />,
}));

describe("VoiceHealthcareAssistant - Conversation History", () => {
  const defaultProps = {
    userId: "user-123",
    userLanguage: "hi-IN",
    loadHistory: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load conversation history on mount when loadHistory is true", async () => {
    const mockHistory = {
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
        {
          id: "conv-2",
          title: "Headache",
          language: "hi",
          started_at: "2024-01-02T14:00:00Z",
          last_message_at: "2024-01-02T14:15:00Z",
          message_count: 3,
          status: "active",
        },
      ],
      total: 2,
    };

    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockResolvedValue(
      mockHistory
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversationHistory).toHaveBeenCalledWith(
        "user-123",
        20,
        0,
        "active"
      );
    });
  });

  it("should not load history when loadHistory is false", async () => {
    const spy = vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory");

    render(<VoiceHealthcareAssistant {...defaultProps} loadHistory={false} />);

    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it("should display conversation history in sheet", async () => {
    const mockHistory = {
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

    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockResolvedValue(
      mockHistory
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Wait for history to load
    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversationHistory).toHaveBeenCalled();
    });

    // Open history sheet
    const historyButton = screen.getByLabelText("View history");
    fireEvent.click(historyButton);

    // Check if conversation appears
    await waitFor(() => {
      expect(screen.getByText("Fever consultation")).toBeInTheDocument();
      expect(screen.getByText("5 संदेश")).toBeInTheDocument();
    });
  });

  it("should switch to a previous conversation when clicked", async () => {
    const mockHistory = {
      success: true,
      conversations: [
        {
          id: "conv-1",
          title: "Fever consultation",
          language: "hi",
          started_at: "2024-01-01T10:00:00Z",
          last_message_at: "2024-01-01T10:30:00Z",
          message_count: 2,
          status: "active",
        },
      ],
      total: 1,
    };

    const mockConversation = {
      success: true,
      conversation: {
        id: "conv-1",
        user_id: "user-123",
        title: "Fever consultation",
        language: "hi",
        started_at: "2024-01-01T10:00:00Z",
        last_message_at: "2024-01-01T10:30:00Z",
        message_count: 2,
        status: "active",
        messages: [
          {
            id: "msg-1",
            conversation_id: "conv-1",
            role: "user" as const,
            content: "मुझे बुखार है",
            created_at: "2024-01-01T10:00:00Z",
          },
          {
            id: "msg-2",
            conversation_id: "conv-1",
            role: "assistant" as const,
            content: "आपको ASHA कार्यकर्ता से संपर्क करना चाहिए",
            created_at: "2024-01-01T10:01:00Z",
          },
        ],
      },
    };

    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockResolvedValue(
      mockHistory
    );
    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversation").mockResolvedValue(
      mockConversation
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Wait for history to load
    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversationHistory).toHaveBeenCalled();
    });

    // Open history sheet
    const historyButton = screen.getByLabelText("View history");
    fireEvent.click(historyButton);

    // Click on conversation
    const conversationButton = await screen.findByText("Fever consultation");
    fireEvent.click(conversationButton);

    // Check if conversation was loaded
    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversation).toHaveBeenCalledWith(
        "conv-1",
        "user-123"
      );
    });

    // Check if messages are displayed
    await waitFor(() => {
      expect(screen.getByText("मुझे बुखार है")).toBeInTheDocument();
      expect(screen.getByText("आपको ASHA कार्यकर्ता से संपर्क करना चाहिए")).toBeInTheDocument();
    });
  });

  it("should load more history when pagination button is clicked", async () => {
    const mockHistory1 = {
      success: true,
      conversations: Array.from({ length: 20 }, (_, i) => ({
        id: `conv-${i}`,
        title: `Conversation ${i}`,
        language: "hi",
        started_at: "2024-01-01T10:00:00Z",
        last_message_at: "2024-01-01T10:30:00Z",
        message_count: 5,
        status: "active",
      })),
      total: 25,
    };

    const mockHistory2 = {
      success: true,
      conversations: Array.from({ length: 5 }, (_, i) => ({
        id: `conv-${i + 20}`,
        title: `Conversation ${i + 20}`,
        language: "hi",
        started_at: "2024-01-01T10:00:00Z",
        last_message_at: "2024-01-01T10:30:00Z",
        message_count: 5,
        status: "active",
      })),
      total: 25,
    };

    const spy = vi
      .spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory")
      .mockResolvedValueOnce(mockHistory1)
      .mockResolvedValueOnce(mockHistory2);

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Wait for initial history to load
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("user-123", 20, 0, "active");
    });

    // Open history sheet
    const historyButton = screen.getByLabelText("View history");
    fireEvent.click(historyButton);

    // Click load more button
    const loadMoreButton = await screen.findByText("और लोड करें");
    fireEvent.click(loadMoreButton);

    // Check if second page was loaded
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith("user-123", 20, 20, "active");
    });
  });

  it("should handle history loading errors", async () => {
    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockRejectedValue(
      new Error("Network error")
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Open history sheet
    await waitFor(() => {
      const historyButton = screen.getByLabelText("View history");
      fireEvent.click(historyButton);
    });

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText("इतिहास लोड करने में त्रुटि")).toBeInTheDocument();
    });
  });

  it("should show empty state when no history exists", async () => {
    const mockHistory = {
      success: true,
      conversations: [],
      total: 0,
    };

    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockResolvedValue(
      mockHistory
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Wait for history to load
    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversationHistory).toHaveBeenCalled();
    });

    // Open history sheet
    const historyButton = screen.getByLabelText("View history");
    fireEvent.click(historyButton);

    // Check for empty state
    await waitFor(() => {
      expect(screen.getByText("कोई पिछली बातचीत नहीं मिली")).toBeInTheDocument();
    });
  });

  it("should hide load more button when no more history", async () => {
    const mockHistory = {
      success: true,
      conversations: Array.from({ length: 10 }, (_, i) => ({
        id: `conv-${i}`,
        title: `Conversation ${i}`,
        language: "hi",
        started_at: "2024-01-01T10:00:00Z",
        last_message_at: "2024-01-01T10:30:00Z",
        message_count: 5,
        status: "active",
      })),
      total: 10,
    };

    vi.spyOn(voiceAssistantAPI.voiceAssistantAPI, "getConversationHistory").mockResolvedValue(
      mockHistory
    );

    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Wait for history to load
    await waitFor(() => {
      expect(voiceAssistantAPI.voiceAssistantAPI.getConversationHistory).toHaveBeenCalled();
    });

    // Open history sheet
    const historyButton = screen.getByLabelText("View history");
    fireEvent.click(historyButton);

    // Check that load more button is not present (less than 20 items)
    await waitFor(() => {
      expect(screen.queryByText("और लोड करें")).not.toBeInTheDocument();
    });
  });
});
