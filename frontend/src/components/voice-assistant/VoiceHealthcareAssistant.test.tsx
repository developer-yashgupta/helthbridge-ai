import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceHealthcareAssistant from "./VoiceHealthcareAssistant";

// Mock child components
vi.mock("./VoiceInput", () => ({
  default: ({ onTranscript, onListeningChange }: any) => (
    <div data-testid="voice-input">
      <button
        onClick={() => {
          onListeningChange(true);
          setTimeout(() => {
            onTranscript("test transcript");
            onListeningChange(false);
          }, 100);
        }}
      >
        Start Recording
      </button>
    </div>
  ),
}));

vi.mock("./VoiceOutput", () => ({
  default: ({ text, onComplete }: any) => (
    <div data-testid="voice-output">
      <span>{text}</span>
      <button onClick={onComplete}>Complete</button>
    </div>
  ),
}));

vi.mock("./ConversationDisplay", () => ({
  default: ({ messages, isLoading }: any) => (
    <div data-testid="conversation-display">
      {messages.map((msg: any) => (
        <div key={msg.id} data-role={msg.role}>
          {msg.content}
        </div>
      ))}
      {isLoading && <div data-testid="loading">Loading...</div>}
    </div>
  ),
}));

vi.mock("./VoiceOutputPreferences", () => ({
  default: ({ enabled, onEnabledChange }: any) => (
    <div data-testid="voice-preferences">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onEnabledChange(e.target.checked)}
        data-testid="voice-toggle"
      />
    </div>
  ),
}));

describe("VoiceHealthcareAssistant", () => {
  const defaultProps = {
    userId: "test-user-123",
    userLanguage: "hi-IN",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the component with title", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    expect(screen.getByText("स्वास्थ्य सहायक")).toBeInTheDocument();
  });

  it("should display welcome message on mount", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    expect(
      screen.getByText(/नमस्ते! मैं आपका स्वास्थ्य सहायक हूं/)
    ).toBeInTheDocument();
  });

  it("should integrate VoiceInput component", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    expect(screen.getByTestId("voice-input")).toBeInTheDocument();
  });

  it("should integrate ConversationDisplay component", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    expect(screen.getByTestId("conversation-display")).toBeInTheDocument();
  });

  it("should integrate VoiceOutputPreferences component", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    expect(screen.getByTestId("voice-preferences")).toBeInTheDocument();
  });

  it("should handle voice transcript and add to conversation", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const startButton = screen.getByText("Start Recording");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText("test transcript")).toBeInTheDocument();
    });
  });

  it("should handle text input submission", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    const submitButton = screen.getByRole("button", { name: "" });

    fireEvent.change(input, { target: { value: "मुझे बुखार है" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("मुझे बुखार है")).toBeInTheDocument();
    });
  });

  it("should show loading state when processing", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    fireEvent.change(input, { target: { value: "test message" } });

    const form = input.closest("form");
    fireEvent.submit(form!);

    // Check that user message was added
    await waitFor(() => {
      expect(screen.getByText("test message")).toBeInTheDocument();
    });

    // Check that assistant response was added (processing complete)
    await waitFor(() => {
      expect(
        screen.getByText("मैं आपके लक्षणों का विश्लेषण कर रहा हूं...")
      ).toBeInTheDocument();
    });
  });

  it("should toggle voice output preference", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const voiceToggle = screen.getByTestId("voice-toggle");
    expect(voiceToggle).not.toBeChecked();

    fireEvent.click(voiceToggle);
    expect(voiceToggle).toBeChecked();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<VoiceHealthcareAssistant {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText("Close assistant");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not render close button when onClose is not provided", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    expect(
      screen.queryByLabelText("Close assistant")
    ).not.toBeInTheDocument();
  });

  it("should disable text input when listening", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      "या यहाँ टाइप करें..."
    ) as HTMLInputElement;

    const startButton = screen.getByText("Start Recording");
    fireEvent.click(startButton);

    // Input should be disabled while listening
    await waitFor(() => {
      expect(input.disabled).toBe(true);
    });
  });

  it("should disable submit button when input is empty", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    const submitButton = screen.getByRole("button", { name: "" });

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "test" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("should clear text input after submission", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      "या यहाँ टाइप करें..."
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "test message" } });
    expect(input.value).toBe("test message");

    const form = input.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("should handle voice output completion", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // Enable voice output
    const voiceToggle = screen.getByTestId("voice-toggle");
    fireEvent.click(voiceToggle);

    // Submit a message
    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    fireEvent.change(input, { target: { value: "test" } });
    const form = input.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByTestId("voice-output")).toBeInTheDocument();
    });

    // Complete voice output
    const completeButton = screen.getByText("Complete");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("voice-output")).not.toBeInTheDocument();
    });
  });

  it("should maintain conversation state across interactions", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);

    // First message
    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    fireEvent.change(input, { target: { value: "message 1" } });
    const form = input.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText("message 1")).toBeInTheDocument();
    });

    // Second message
    fireEvent.change(input, { target: { value: "message 2" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText("message 1")).toBeInTheDocument();
      expect(screen.getByText("message 2")).toBeInTheDocument();
    });
  });
});
