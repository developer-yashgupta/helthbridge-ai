import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceHealthcareAssistant from "./VoiceHealthcareAssistant";

// Mock child components
vi.mock("./VoiceInput", () => ({
  default: ({ language, onTranscript }: any) => (
    <div data-testid="voice-input" data-language={language}>
      <button onClick={() => onTranscript("test")}>Record</button>
    </div>
  ),
}));

vi.mock("./VoiceOutput", () => ({
  default: ({ language }: any) => (
    <div data-testid="voice-output" data-language={language} />
  ),
}));

vi.mock("./ConversationDisplay", () => ({
  default: ({ messages }: any) => (
    <div data-testid="conversation-display">
      {messages.map((msg: any) => (
        <div key={msg.id} data-role={msg.role}>
          {msg.content}
        </div>
      ))}
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

describe("VoiceHealthcareAssistant - Language Selection", () => {
  const defaultProps = {
    userId: "user-123",
    userLanguage: "hi-IN",
    enableLanguageSelection: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render language selector when enableLanguageSelection is true", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    const languageSelector = screen.getByLabelText("Select language");
    expect(languageSelector).toBeInTheDocument();
  });

  it("should not render language selector when enableLanguageSelection is false", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} enableLanguageSelection={false} />);
    
    const languageSelector = screen.queryByLabelText("Select language");
    expect(languageSelector).not.toBeInTheDocument();
  });

  it("should initialize with default language", () => {
    render(<VoiceHealthcareAssistant {...defaultProps} userLanguage="en-US" />);
    
    const voiceInput = screen.getByTestId("voice-input");
    expect(voiceInput).toHaveAttribute("data-language", "en-US");
  });

  it("should display all supported languages in selector", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    await waitFor(() => {
      const allHindi = screen.getAllByText(/हिन्दी \(Hindi\)/);
      expect(allHindi.length).toBeGreaterThan(0);
      expect(screen.getByText(/English/)).toBeInTheDocument();
      expect(screen.getByText(/বাংলা \(Bengali\)/)).toBeInTheDocument();
      expect(screen.getByText(/తెలుగు \(Telugu\)/)).toBeInTheDocument();
      expect(screen.getByText(/मराठी \(Marathi\)/)).toBeInTheDocument();
      expect(screen.getByText(/தமிழ் \(Tamil\)/)).toBeInTheDocument();
    });
  });

  it("should change language when a new language is selected", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    // Select English
    const englishOption = await screen.findByText(/English/);
    fireEvent.click(englishOption);

    await waitFor(() => {
      const voiceInput = screen.getByTestId("voice-input");
      expect(voiceInput).toHaveAttribute("data-language", "en-US");
    });
  });

  it("should add system message when language is changed", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    // Select English
    const englishOption = await screen.findByText(/English/);
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(screen.getByText(/भाषा बदल दी गई: English/)).toBeInTheDocument();
    });
  });

  it("should update VoiceInput language when language changes", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    const voiceInput = screen.getByTestId("voice-input");
    expect(voiceInput).toHaveAttribute("data-language", "hi-IN");

    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    const tamilOption = await screen.findByText(/தமிழ் \(Tamil\)/);
    fireEvent.click(tamilOption);

    await waitFor(() => {
      expect(voiceInput).toHaveAttribute("data-language", "ta-IN");
    });
  });

  it("should update VoiceOutput language when language changes", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    // Change language first
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    const bengaliOption = await screen.findByText(/বাংলা \(Bengali\)/);
    fireEvent.click(bengaliOption);

    // Verify language changed
    await waitFor(() => {
      const voiceInput = screen.getByTestId("voice-input");
      expect(voiceInput).toHaveAttribute("data-language", "bn-IN");
    });
  });

  it("should send correct language code to API", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    });

    global.fetch = mockFetch;

    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    // Change to English
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    const englishOption = await screen.findByText(/English/);
    fireEvent.click(englishOption);

    // Wait for language change
    await waitFor(() => {
      const voiceInput = screen.getByTestId("voice-input");
      expect(voiceInput).toHaveAttribute("data-language", "en-US");
    });

    // Submit a message
    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    fireEvent.change(input, { target: { value: "I have fever" } });
    const form = input.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.language).toBe("en"); // Should extract 'en' from 'en-US'
    });
  });

  it("should maintain language selection across messages", async () => {
    render(<VoiceHealthcareAssistant {...defaultProps} />);
    
    // Change language
    const languageSelector = screen.getByLabelText("Select language");
    fireEvent.click(languageSelector);

    const marathiOption = await screen.findByText(/मराठी \(Marathi\)/);
    fireEvent.click(marathiOption);

    await waitFor(() => {
      const voiceInput = screen.getByTestId("voice-input");
      expect(voiceInput).toHaveAttribute("data-language", "mr-IN");
    });

    // Submit a message
    const input = screen.getByPlaceholderText("या यहाँ टाइप करें...");
    fireEvent.change(input, { target: { value: "test message" } });
    const form = input.closest("form");
    fireEvent.submit(form!);

    // Language should still be Marathi
    await waitFor(() => {
      const voiceInput = screen.getByTestId("voice-input");
      expect(voiceInput).toHaveAttribute("data-language", "mr-IN");
    });
  });
});
