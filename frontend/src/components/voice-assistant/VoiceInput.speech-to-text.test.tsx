import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VoiceInput from "./VoiceInput";

describe("VoiceInput - Speech-to-Text Conversion", () => {
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

  describe("Language Support Configuration", () => {
    it("should configure speech recognition with Hindi language", () => {
      let recognitionInstance: any = null;

      const MockSpeechRecognition = vi.fn(function (this: any) {
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
        this.maxAlternatives = 1;
        this.start = vi.fn();
        this.stop = vi.fn();
        this.abort = vi.fn();
        recognitionInstance = this;
      });

      (global as any).SpeechRecognition = MockSpeechRecognition;

      render(<VoiceInput {...defaultProps} language="hi-IN" />);

      expect(recognitionInstance).not.toBeNull();
      expect(recognitionInstance.lang).toBe("hi-IN");
    });

    it("should configure speech recognition with English language", () => {
      let recognitionInstance: any = null;

      const MockSpeechRecognition = vi.fn(function (this: any) {
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
        this.maxAlternatives = 1;
        this.start = vi.fn();
        this.stop = vi.fn();
        this.abort = vi.fn();
        recognitionInstance = this;
      });

      (global as any).SpeechRecognition = MockSpeechRecognition;

      render(<VoiceInput {...defaultProps} language="en-US" />);

      expect(recognitionInstance).not.toBeNull();
      expect(recognitionInstance.lang).toBe("en-US");
    });

    it("should default to Hindi when no language specified", () => {
      let recognitionInstance: any = null;

      const MockSpeechRecognition = vi.fn(function (this: any) {
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
        this.maxAlternatives = 1;
        this.start = vi.fn();
        this.stop = vi.fn();
        this.abort = vi.fn();
        recognitionInstance = this;
      });

      (global as any).SpeechRecognition = MockSpeechRecognition;

      render(<VoiceInput {...defaultProps} language="" />);

      expect(recognitionInstance).not.toBeNull();
      expect(recognitionInstance.lang).toBe("hi-IN");
    });
  });

  describe("Real-time Transcription Updates", () => {
    it("should display interim results in real-time", async () => {
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

      // Simulate multiple interim results
      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "मेरे सिर", confidence: 0.8 },
                isFinal: false,
                length: 1,
              },
            ],
          });
        }
      });

      expect(screen.getByText("मेरे सिर")).toBeInTheDocument();

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "मेरे सिर में दर्द", confidence: 0.8 },
                isFinal: false,
                length: 1,
              },
            ],
          });
        }
      });

      expect(screen.getByText("मेरे सिर में दर्द")).toBeInTheDocument();
    });

    it("should clear interim transcript when final result received", async () => {
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

      // Show interim
      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "interim text", confidence: 0.8 },
                isFinal: false,
                length: 1,
              },
            ],
          });
        }
      });

      expect(screen.getByText("interim text")).toBeInTheDocument();

      // Send final result
      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "final text", confidence: 0.9 },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      // Interim should be cleared
      expect(screen.queryByText("interim text")).not.toBeInTheDocument();
    });
  });

  describe("Final Transcript Extraction", () => {
    it("should extract and send final transcript", async () => {
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

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: {
                  transcript: "मुझे बुखार है और सिर में दर्द है",
                  confidence: 0.95,
                },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith(
        "मुझे बुखार है और सिर में दर्द है"
      );
    });

    it("should trim whitespace from final transcript", async () => {
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

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: {
                  transcript: "  text with spaces  ",
                  confidence: 0.9,
                },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith("text with spaces");
    });

    it("should handle multiple final results in sequence", async () => {
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

      // First result
      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "first sentence", confidence: 0.9 },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith("first sentence");

      // Second result
      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "second sentence", confidence: 0.9 },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith("second sentence");
      expect(mockOnTranscript).toHaveBeenCalledTimes(2);
    });
  });

  describe("Confidence Score Checking", () => {
    it("should accept transcripts with confidence >= 0.5", async () => {
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

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "acceptable confidence", confidence: 0.5 },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith("acceptable confidence");
    });

    it("should reject transcripts with confidence < 0.5", async () => {
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

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "low confidence", confidence: 0.4 },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).not.toHaveBeenCalled();
    });

    it("should accept transcripts when confidence is undefined", async () => {
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

      await act(async () => {
        if (resultHandler) {
          resultHandler({
            resultIndex: 0,
            results: [
              {
                0: { transcript: "no confidence score", confidence: undefined },
                isFinal: true,
                length: 1,
              },
            ],
          });
        }
      });

      expect(mockOnTranscript).toHaveBeenCalledWith("no confidence score");
    });
  });

  describe("Error Handling with Fallback", () => {
    it("should handle no-speech error with appropriate message", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "no-speech" });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining("कोई आवाज़ नहीं सुनाई दी")
        );
      });
    });

    it("should handle audio-capture error", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "audio-capture" });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining("माइक्रोफोन एक्सेस नहीं मिला")
        );
      });
    });

    it("should handle not-allowed error", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "not-allowed" });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining("माइक्रोफोन की अनुमति नहीं मिली")
        );
      });
    });

    it("should handle network error", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "network" });
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining("नेटवर्क समस्या")
        );
      });
    });

    it("should not call onError for aborted error", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "aborted" });
      }

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it("should stop listening on error", async () => {
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

      if (errorHandler) {
        errorHandler({ error: "network" });
      }

      await waitFor(() => {
        expect(mockOnListeningChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
