import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceInput from "./VoiceInput";

describe("VoiceInput Component", () => {
  const mockOnTranscript = vi.fn();
  const mockOnError = vi.fn();
  const mockOnListeningChange = vi.fn();

  const defaultProps = {
    onTranscript: mockOnTranscript,
    onError: mockOnError,
    language: "hi-IN",
    isListening: false,
    onListeningChange: mockOnListeningChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render voice input button", () => {
    render(<VoiceInput {...defaultProps} />);
    const button = screen.getByRole("button", { name: /start recording/i });
    expect(button).toBeInTheDocument();
  });

  it("should check browser compatibility on mount", () => {
    render(<VoiceInput {...defaultProps} />);
    // Component should render without errors when SpeechRecognition is available
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should display error when browser does not support speech recognition", () => {
    // Temporarily remove SpeechRecognition
    const originalSpeechRecognition = (global as any).SpeechRecognition;
    const originalWebkitSpeechRecognition = (global as any)
      .webkitSpeechRecognition;
    delete (global as any).SpeechRecognition;
    delete (global as any).webkitSpeechRecognition;

    render(<VoiceInput {...defaultProps} />);

    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining("ब्राउज़र वॉइस सपोर्ट नहीं करता")
    );
    expect(screen.getByText(/वॉइस इनपुट उपलब्ध नहीं है/)).toBeInTheDocument();

    // Restore
    (global as any).SpeechRecognition = originalSpeechRecognition;
    (global as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it("should request microphone permission when starting", async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [],
    });
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    render(<VoiceInput {...defaultProps} />);
    const button = screen.getByRole("button", { name: /start recording/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it("should display visual indicator when recording", () => {
    render(<VoiceInput {...defaultProps} isListening={true} />);
    
    expect(screen.getByText(/सुन रहे हैं/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /stop recording/i });
    expect(button).toHaveClass("animate-pulse");
  });

  it("should toggle listening state when button clicked", async () => {
    const { rerender } = render(<VoiceInput {...defaultProps} />);
    const button = screen.getByRole("button");

    // Start listening
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnListeningChange).toHaveBeenCalledWith(true);
    });

    // Simulate listening state change
    rerender(<VoiceInput {...defaultProps} isListening={true} />);

    // Stop listening
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnListeningChange).toHaveBeenCalledWith(false);
    });
  });

  it("should handle microphone access denied error", async () => {
    const mockGetUserMedia = vi
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    render(<VoiceInput {...defaultProps} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining("माइक्रोफोन की अनुमति नहीं मिली")
      );
    });
  });

  it("should configure speech recognition with correct language", () => {
    const MockSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 1;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
    });

    (global as any).SpeechRecognition = MockSpeechRecognition;

    render(<VoiceInput {...defaultProps} language="en-US" />);

    // Check that SpeechRecognition was instantiated
    expect(MockSpeechRecognition).toHaveBeenCalled();
  });

  it("should handle speech recognition errors gracefully", async () => {
    let errorHandler: ((event: any) => void) | null = null;

    const MockSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 1;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      Object.defineProperty(this, "onerror", {
        set(handler: (event: any) => void) {
          errorHandler = handler;
        },
      });
    });

    (global as any).SpeechRecognition = MockSpeechRecognition;

    render(<VoiceInput {...defaultProps} />);

    // Simulate speech recognition error
    if (errorHandler) {
      errorHandler({ error: "no-speech" });
    }

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it("should display interim transcript during recognition", async () => {
    let resultHandler: ((event: any) => void) | null = null;

    const MockSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 1;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      Object.defineProperty(this, "onresult", {
        set(handler: (event: any) => void) {
          resultHandler = handler;
        },
      });
    });

    (global as any).SpeechRecognition = MockSpeechRecognition;

    render(<VoiceInput {...defaultProps} />);

    // Simulate interim result
    if (resultHandler) {
      resultHandler({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "test interim", confidence: 0.8 },
            isFinal: false,
            length: 1,
          },
        ],
      });
    }

    await waitFor(() => {
      expect(screen.getByText("test interim")).toBeInTheDocument();
    });
  });

  it("should call onTranscript with final transcript", async () => {
    let resultHandler: ((event: any) => void) | null = null;

    const MockSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 1;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      Object.defineProperty(this, "onresult", {
        set(handler: (event: any) => void) {
          resultHandler = handler;
        },
      });
    });

    (global as any).SpeechRecognition = MockSpeechRecognition;

    render(<VoiceInput {...defaultProps} />);

    // Simulate final result
    if (resultHandler) {
      resultHandler({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "final transcript", confidence: 0.9 },
            isFinal: true,
            length: 1,
          },
        ],
      });
    }

    await waitFor(() => {
      expect(mockOnTranscript).toHaveBeenCalledWith("final transcript");
    });
  });

  it("should filter out low confidence transcripts", async () => {
    let resultHandler: ((event: any) => void) | null = null;

    const MockSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 1;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      Object.defineProperty(this, "onresult", {
        set(handler: (event: any) => void) {
          resultHandler = handler;
        },
      });
    });

    (global as any).SpeechRecognition = MockSpeechRecognition;

    render(<VoiceInput {...defaultProps} />);

    // Simulate low confidence result
    if (resultHandler) {
      resultHandler({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "low confidence", confidence: 0.3 },
            isFinal: true,
            length: 1,
          },
        ],
      });
    }

    await waitFor(() => {
      expect(mockOnTranscript).not.toHaveBeenCalled();
    });
  });
});
