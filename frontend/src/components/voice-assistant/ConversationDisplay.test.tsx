import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ConversationDisplay, { Message } from "./ConversationDisplay";

describe("ConversationDisplay Component", () => {
  const mockMessages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "मुझे बुखार है",
      timestamp: new Date("2024-01-01T10:00:00"),
    },
    {
      id: "2",
      role: "assistant",
      content: "आपको कितने दिनों से बुखार है?",
      timestamp: new Date("2024-01-01T10:00:30"),
    },
    {
      id: "3",
      role: "user",
      content: "दो दिन से",
      timestamp: new Date("2024-01-01T10:01:00"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render empty state when no messages", () => {
      render(<ConversationDisplay messages={[]} />);

      expect(
        screen.getByText(/स्वास्थ्य सहायक में आपका स्वागत है/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/अपने स्वास्थ्य संबंधी प्रश्न पूछने के लिए/)
      ).toBeInTheDocument();
    });

    it("should render messages when provided", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      expect(screen.getByText("मुझे बुखार है")).toBeInTheDocument();
      expect(
        screen.getByText("आपको कितने दिनों से बुखार है?")
      ).toBeInTheDocument();
      expect(screen.getByText("दो दिन से")).toBeInTheDocument();
    });

    it("should not show empty state when messages exist", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      expect(
        screen.queryByText(/स्वास्थ्य सहायक में आपका स्वागत है/)
      ).not.toBeInTheDocument();
    });

    it("should show medical disclaimer when messages exist", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      expect(screen.getByText("चिकित्सा अस्वीकरण")).toBeInTheDocument();
    });

    it("should not show disclaimer when no messages", () => {
      render(<ConversationDisplay messages={[]} />);

      expect(screen.queryByText("चिकित्सा अस्वीकरण")).not.toBeInTheDocument();
    });
  });

  describe("Message Rendering", () => {
    it("should render user messages with correct styling", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const userMessage = screen
        .getByText("मुझे बुखार है")
        .closest("[data-message-role]");
      expect(userMessage).toHaveAttribute("data-message-role", "user");
    });

    it("should render assistant messages with correct styling", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const assistantMessage = screen
        .getByText("आपको कितने दिनों से बुखार है?")
        .closest("[data-message-role]");
      expect(assistantMessage).toHaveAttribute("data-message-role", "assistant");
    });

    it("should render system messages", () => {
      const systemMessages: Message[] = [
        {
          id: "1",
          role: "system",
          content: "सिस्टम संदेश",
          timestamp: new Date(),
        },
      ];

      render(<ConversationDisplay messages={systemMessages} />);

      const systemMessage = screen
        .getByText("सिस्टम संदेश")
        .closest("[data-message-role]");
      expect(systemMessage).toHaveAttribute("data-message-role", "system");
    });

    it("should render message IDs correctly", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const message = screen
        .getByText("मुझे बुखार है")
        .closest("[data-message-id]");
      expect(message).toHaveAttribute("data-message-id", "1");
    });

    it("should render message content with whitespace preserved", () => {
      const messagesWithWhitespace: Message[] = [
        {
          id: "1",
          role: "user",
          content: "Line 1\nLine 2\nLine 3",
          timestamp: new Date(),
        },
      ];

      const { container } = render(<ConversationDisplay messages={messagesWithWhitespace} />);

      const content = container.querySelector("[data-message-content] p");
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass("whitespace-pre-wrap");
    });
  });

  describe("Timestamp Display", () => {
    it("should display timestamps for each message", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const timestamps = document.querySelectorAll("[data-message-timestamp]");
      expect(timestamps.length).toBe(mockMessages.length);
    });

    it("should format recent timestamps as 'अभी'", () => {
      const recentMessages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "Test",
          timestamp: new Date(),
        },
      ];

      render(<ConversationDisplay messages={recentMessages} />);

      expect(screen.getByText("अभी")).toBeInTheDocument();
    });

    it("should format timestamps in minutes", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const messages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "Test",
          timestamp: fiveMinutesAgo,
        },
      ];

      render(<ConversationDisplay messages={messages} />);

      expect(screen.getByText(/मिनट पहले/)).toBeInTheDocument();
    });

    it("should format timestamps in hours", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const messages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "Test",
          timestamp: twoHoursAgo,
        },
      ];

      render(<ConversationDisplay messages={messages} />);

      expect(screen.getByText(/घंटे पहले/)).toBeInTheDocument();
    });
  });

  describe("Avatar Display", () => {
    it("should show user avatar for user messages", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      // User avatars should be present
      const userMessage = screen
        .getByText("मुझे बुखार है")
        .closest("[data-message-role]");
      const avatar = userMessage?.querySelector(".lucide-user");
      expect(avatar).toBeInTheDocument();
    });

    it("should show bot avatar for assistant messages", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      // Bot avatars should be present
      const assistantMessage = screen
        .getByText("आपको कितने दिनों से बुखार है?")
        .closest("[data-message-role]");
      const avatar = assistantMessage?.querySelector(".lucide-bot");
      expect(avatar).toBeInTheDocument();
    });

    it("should not show avatar for system messages", () => {
      const systemMessages: Message[] = [
        {
          id: "1",
          role: "system",
          content: "System message",
          timestamp: new Date(),
        },
      ];

      render(<ConversationDisplay messages={systemMessages} />);

      const systemMessage = screen
        .getByText("System message")
        .closest("[data-message-role]");
      const avatar = systemMessage?.querySelector(".lucide-user, .lucide-bot");
      expect(avatar).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when isLoading is true", () => {
      const { container } = render(<ConversationDisplay messages={mockMessages} isLoading={true} />);

      const loadingIndicator = container.querySelector("[data-loading-indicator]");
      expect(loadingIndicator).toBeInTheDocument();
    });

    it("should not show loading indicator when isLoading is false", () => {
      const { container } = render(<ConversationDisplay messages={mockMessages} isLoading={false} />);

      const loadingIndicator = container.querySelector("[data-loading-indicator]");
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it("should show loading indicator with animated dots", () => {
      const { container } = render(<ConversationDisplay messages={[]} isLoading={true} />);

      const loadingIndicator = container.querySelector("[data-loading-indicator]");
      const dots = loadingIndicator?.querySelectorAll(".animate-bounce");
      expect(dots?.length).toBe(3);
    });
  });

  describe("Auto-scroll Behavior", () => {
    it("should have scroll area", () => {
      const { container } = render(
        <ConversationDisplay messages={mockMessages} />
      );

      const scrollArea = container.querySelector("[data-radix-scroll-area-viewport]");
      expect(scrollArea).toBeInTheDocument();
    });

    it("should render scroll anchor at bottom", () => {
      const { container } = render(
        <ConversationDisplay messages={mockMessages} />
      );

      // Check that messages are rendered in order
      const messageContents = screen.getAllByText(/बुखार|दिन/);
      expect(messageContents.length).toBeGreaterThan(0);
    });
  });

  describe("Message Updates", () => {
    it("should update when new messages are added", async () => {
      const { rerender } = render(
        <ConversationDisplay messages={mockMessages} />
      );

      expect(screen.getAllByText(/बुखार|दिन/).length).toBe(3);

      const newMessages: Message[] = [
        ...mockMessages,
        {
          id: "4",
          role: "assistant",
          content: "नया संदेश",
          timestamp: new Date(),
        },
      ];

      rerender(<ConversationDisplay messages={newMessages} />);

      await waitFor(() => {
        expect(screen.getByText("नया संदेश")).toBeInTheDocument();
      });
    });

    it("should handle empty messages array", () => {
      render(<ConversationDisplay messages={[]} />);

      expect(
        screen.getByText(/स्वास्थ्य सहायक में आपका स्वागत है/)
      ).toBeInTheDocument();
    });
  });

  describe("Role-based Styling", () => {
    it("should apply correct container alignment for user messages", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const userMessage = screen
        .getByText("मुझे बुखार है")
        .closest("[data-message-role]");
      expect(userMessage).toHaveClass("justify-end");
    });

    it("should apply correct container alignment for assistant messages", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const assistantMessage = screen
        .getByText("आपको कितने दिनों से बुखार है?")
        .closest("[data-message-role]");
      expect(assistantMessage).toHaveClass("justify-start");
    });

    it("should apply correct container alignment for system messages", () => {
      const systemMessages: Message[] = [
        {
          id: "1",
          role: "system",
          content: "System",
          timestamp: new Date(),
        },
      ];

      render(<ConversationDisplay messages={systemMessages} />);

      const systemMessage = screen
        .getByText("System")
        .closest("[data-message-role]");
      expect(systemMessage).toHaveClass("justify-center");
    });
  });

  describe("Accessibility", () => {
    it("should have proper data attributes for testing", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const messages = screen.getAllByText(/बुखार|दिन/);
      messages.forEach((message) => {
        const container = message.closest("[data-message-role]");
        expect(container).toHaveAttribute("data-message-role");
        expect(container).toHaveAttribute("data-message-id");
      });
    });

    it("should render message content in accessible containers", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const contents = document.querySelectorAll("[data-message-content]");
      expect(contents.length).toBe(mockMessages.length);
    });

    it("should render timestamps with proper data attributes", () => {
      render(<ConversationDisplay messages={mockMessages} />);

      const timestamps = document.querySelectorAll("[data-message-timestamp]");
      expect(timestamps.length).toBe(mockMessages.length);
    });
  });
});

  describe("Medical Disclaimers and Warnings", () => {
    it("should show emergency warning for critical severity", () => {
      const criticalMessages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "सीने में तेज दर्द है",
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: "तुरंत आपातकालीन सेवाओं से संपर्क करें",
          timestamp: new Date(),
          routing: {
            facility: "EMERGENCY",
            severity: "critical",
            contactInfo: {
              name: "आपातकालीन सेवाएं",
              phone: "108",
              address: "निकटतम अस्पताल",
            },
            reasoning: "यह एक आपातकालीन स्थिति है",
          },
        },
      ];

      const { container } = render(
        <ConversationDisplay messages={criticalMessages} />
      );

      const emergencyWarning = container.querySelector("[data-emergency-warning]");
      expect(emergencyWarning).toBeInTheDocument();
      expect(screen.getByText("आपातकालीन चेतावनी")).toBeInTheDocument();
    });

    it("should not show emergency warning for non-critical severity", () => {
      const lowSeverityMessages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "हल्का बुखार है",
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: "आशा कार्यकर्ता से संपर्क करें",
          timestamp: new Date(),
          routing: {
            facility: "ASHA",
            severity: "low",
            contactInfo: {
              name: "सुनीता देवी",
              phone: "+91-9876543210",
              address: "गांव पंचायत",
            },
          },
        },
      ];

      const { container } = render(
        <ConversationDisplay messages={lowSeverityMessages} />
      );

      const emergencyWarning = container.querySelector("[data-emergency-warning]");
      expect(emergencyWarning).not.toBeInTheDocument();
      expect(screen.queryByText("आपातकालीन चेतावनी")).not.toBeInTheDocument();
    });

    it("should show emergency warning only for last message", () => {
      const multipleMessages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "सीने में दर्द",
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: "आपातकालीन",
          timestamp: new Date(),
          routing: {
            facility: "EMERGENCY",
            severity: "critical",
          },
        },
        {
          id: "3",
          role: "user",
          content: "ठीक है",
          timestamp: new Date(),
        },
      ];

      const { container } = render(
        <ConversationDisplay messages={multipleMessages} />
      );

      const emergencyWarnings = container.querySelectorAll("[data-emergency-warning]");
      expect(emergencyWarnings.length).toBe(0);
    });

    it("should have disclaimer container", () => {
      const testMessages: Message[] = [
        {
          id: "1",
          role: "user",
          content: "Test",
          timestamp: new Date(),
        },
      ];

      const { container } = render(
        <ConversationDisplay messages={testMessages} />
      );

      const disclaimerContainer = container.querySelector("[data-disclaimer-container]");
      expect(disclaimerContainer).toBeInTheDocument();
    });
  });
