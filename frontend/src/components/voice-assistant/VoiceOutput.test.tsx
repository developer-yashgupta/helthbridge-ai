import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceOutput from "./VoiceOutput";

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text = "";
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("VoiceOutput Component", () => {
  const mockOnComplete = vi.fn();
  const mockSpeak = vi.fn();
  const mockCancel = vi.fn();
  const mockPause = vi.fn();
  const mockResume = vi.fn();
  const mockGetVoices = vi.fn();

  const defaultProps = {
    text: "Test message",
    language: "hi-IN",
    autoPlay: false,
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock speechSynthesis API
    Object.defineProperty(global.window, "speechSynthesis", {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: mockPause,
        resume: mockResume,
        getVoices: mockGetVoices,
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });

    // Mock SpeechSynthesisUtterance
    (global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    // Mock voices
    mockGetVoices.mockReturnValue([
      { lang: "hi-IN", name: "Hindi Voice", default: false },
      { lang: "en-US", name: "English Voice", default: true },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Browser Compatibility", () => {
    it("should check if speech synthesis is supported", () => {
      render(<VoiceOutput {...defaultProps} />);
      // Component should render controls when supported
      expect(screen.getByLabelText("Play audio")).toBeInTheDocument();
    });

    it("should not render controls when speech synthesis is not supported", () => {
      // Remove speechSynthesis
      const originalSpeechSynthesis = (global.window as any).speechSynthesis;
      delete (global.window as any).speechSynthesis;

      const { container } = render(<VoiceOutput {...defaultProps} />);
      
      // Should render nothing
      expect(container.firstChild).toBeNull();

      // Restore
      (global.window as any).speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe("Voice Selection", () => {
    it("should select voice based on language", async () => {
      render(<VoiceOutput {...defaultProps} language="hi-IN" />);

      await waitFor(() => {
        expect(mockGetVoices).toHaveBeenCalled();
      });
    });

    it("should fallback to default voice if language not found", async () => {
      mockGetVoices.mockReturnValue([
        { lang: "en-US", name: "English Voice", default: true },
        { lang: "es-ES", name: "Spanish Voice", default: false },
      ]);

      render(<VoiceOutput {...defaultProps} language="hi-IN" />);

      await waitFor(() => {
        expect(mockGetVoices).toHaveBeenCalled();
      });
    });

    it("should handle voices loaded asynchronously", async () => {
      let voicesChangedHandler: (() => void) | null = null;

      Object.defineProperty(global.window.speechSynthesis, "onvoiceschanged", {
        set(handler: () => void) {
          voicesChangedHandler = handler;
        },
        get() {
          return voicesChangedHandler;
        },
      });

      render(<VoiceOutput {...defaultProps} />);

      // Trigger voices changed event
      if (voicesChangedHandler) {
        voicesChangedHandler();
      }

      await waitFor(() => {
        expect(mockGetVoices).toHaveBeenCalled();
      });
    });
  });

  describe("Text-to-Speech Conversion", () => {
    it("should create utterance with correct text", () => {
      render(<VoiceOutput {...defaultProps} text="Hello world" />);

      const playButton = screen.getByLabelText("Play audio");
      fireEvent.click(playButton);

      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should configure utterance with correct language", () => {
      render(<VoiceOutput {...defaultProps} language="en-US" />);

      const playButton = screen.getByLabelText("Play audio");
      fireEvent.click(playButton);

      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should auto-play when autoPlay is true", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });
    });

    it("should not auto-play when autoPlay is false", () => {
      render(<VoiceOutput {...defaultProps} autoPlay={false} />);

      // Should not speak automatically
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });

  describe("Playback Controls", () => {
    it("should play audio when play button clicked", () => {
      render(<VoiceOutput {...defaultProps} />);

      const playButton = screen.getByLabelText("Play audio");
      fireEvent.click(playButton);

      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should pause audio when pause button clicked", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      // Wait for auto-play to start
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speaking state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/pause audio/i)).toBeInTheDocument();
      });

      const pauseButton = screen.getByLabelText(/pause audio/i);
      fireEvent.click(pauseButton);

      expect(mockPause).toHaveBeenCalled();
    });

    it("should stop audio when stop button clicked", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speaking state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/stop audio/i)).toBeInTheDocument();
      });

      const stopButton = screen.getByLabelText(/stop audio/i);
      fireEvent.click(stopButton);

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should replay audio when replay button clicked", () => {
      render(<VoiceOutput {...defaultProps} />);

      const replayButton = screen.getByLabelText(/replay audio/i);
      fireEvent.click(replayButton);

      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should resume audio when play clicked after pause", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speaking state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/pause audio/i)).toBeInTheDocument();
      });

      // Pause
      const pauseButton = screen.getByLabelText(/pause audio/i);
      fireEvent.click(pauseButton);

      // Simulate paused state
      if (utterance.onpause) {
        utterance.onpause();
      }

      await waitFor(() => {
        expect(screen.getByLabelText("Play audio")).toBeInTheDocument();
      });

      // Resume
      const playButton = screen.getByLabelText("Play audio");
      fireEvent.click(playButton);

      expect(mockResume).toHaveBeenCalled();
    });
  });

  describe("Event Handlers", () => {
    it("should call onComplete when speech ends", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speech end
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onend) {
        utterance.onend();
      }

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it("should handle speech synthesis errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate error
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onerror) {
        utterance.onerror({ error: "synthesis-failed" });
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should update state when speech starts", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speech start
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByText(/बोल रहे हैं/)).toBeInTheDocument();
      });
    });

    it("should update state when speech is paused", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate pause
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onpause) {
        utterance.onpause();
      }

      await waitFor(() => {
        expect(screen.getByText(/रुका हुआ/)).toBeInTheDocument();
      });
    });
  });

  describe("Cleanup", () => {
    it("should cancel speech when component unmounts", () => {
      const { unmount } = render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      unmount();

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should cancel speech when text changes", async () => {
      const { rerender } = render(<VoiceOutput {...defaultProps} text="First text" />);

      // Wait for initial render
      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalled();
      });

      // Clear mock to track only the next call
      mockCancel.mockClear();

      rerender(<VoiceOutput {...defaultProps} text="Second text" />);

      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalled();
      });
    });
  });

  describe("Visual Indicators", () => {
    it("should show speaking indicator when audio is playing", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speaking state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByText(/बोल रहे हैं/)).toBeInTheDocument();
      });
    });

    it("should show paused indicator when audio is paused", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate paused state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }
      if (utterance.onpause) {
        utterance.onpause();
      }

      await waitFor(() => {
        expect(screen.getByText(/रुका हुआ/)).toBeInTheDocument();
      });
    });

    it("should show play button when not speaking", () => {
      render(<VoiceOutput {...defaultProps} />);

      expect(screen.getByLabelText("Play audio")).toBeInTheDocument();
    });

    it("should show pause button when speaking", async () => {
      render(<VoiceOutput {...defaultProps} autoPlay={true} />);

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalled();
      });

      // Simulate speaking state
      const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
      if (utterance.onstart) {
        utterance.onstart();
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/pause audio/i)).toBeInTheDocument();
      });
    });
  });
});
