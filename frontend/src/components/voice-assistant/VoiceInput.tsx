"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  language: string;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

// Global Speech Recognition types for browser compatibility
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

// Browser compatibility check for Web Speech API
const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};

// Get SpeechRecognition constructor
const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
};

export default function VoiceInput({
  onTranscript,
  onError,
  language,
  isListening,
  onListeningChange,
}: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);

    if (!supported) {
      onError(
        "यह ब्राउज़र वॉइस सपोर्ट नहीं करता। कृपया Chrome, Edge, या Safari का उपयोग करें।"
      );
    }
  }, [onError]);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();

    // Configure speech recognition
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Get real-time results
    recognition.lang = language || "hi-IN"; // Default to Hindi
    recognition.maxAlternatives = 1;

    // Handle speech recognition results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          // Check confidence score (threshold: 0.5)
          if (confidence >= 0.5 || confidence === undefined) {
            final += transcript;
          }
        } else {
          interim += transcript;
        }
      }

      // Update interim transcript for real-time feedback
      if (interim) {
        setInterimTranscript(interim);
      }

      // Send final transcript to parent
      if (final) {
        setInterimTranscript("");
        onTranscript(final.trim());
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);

      let errorMessage = "आवाज़ समझने में समस्या";

      switch (event.error) {
        case "no-speech":
          errorMessage = "कोई आवाज़ नहीं सुनाई दी। कृपया फिर से बोलें।";
          break;
        case "audio-capture":
          errorMessage = "माइक्रोफोन एक्सेस नहीं मिला। कृपया अनुमति दें।";
          break;
        case "not-allowed":
          errorMessage =
            "माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।";
          break;
        case "network":
          errorMessage = "नेटवर्क समस्या। कृपया इंटरनेट कनेक्शन जांचें।";
          break;
        case "aborted":
          // User stopped, not an error
          break;
        default:
          errorMessage = `आवाज़ पहचान में त्रुटि: ${event.error}`;
      }

      if (event.error !== "aborted") {
        onError(errorMessage);
      }

      // Stop listening on error
      onListeningChange(false);
    };

    // Handle end of speech recognition
    recognition.onend = () => {
      setInterimTranscript("");
      onListeningChange(false);
    };

    // Handle start of speech recognition
    recognition.onstart = () => {
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, language, onTranscript, onError, onListeningChange]);

  // Start listening
  const startListening = async () => {
    if (!isSupported) {
      onError(
        "यह ब्राउज़र वॉइस सपोर्ट नहीं करता। कृपया Chrome, Edge, या Safari का उपयोग करें।"
      );
      return;
    }

    if (!recognitionRef.current) {
      onError("वॉइस सिस्टम तैयार नहीं है। कृपया पेज रीलोड करें।");
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start recognition
      recognitionRef.current.start();
      onListeningChange(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      onError(
        "माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।"
      );
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setInterimTranscript("");
    onListeningChange(false);
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Voice input button with enhanced visual effects */}
      <div className="relative">
        {/* Animated background rings when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1s' }} />
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
          </>
        )}
        
        <Button
          onClick={toggleListening}
          disabled={!isSupported}
          size="lg"
          className={`relative w-20 h-20 rounded-full transition-all duration-300 shadow-lg ${
            isListening
              ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 scale-110"
              : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:scale-105"
          }`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 animate-pulse" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* Glowing effect when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse" />
        )}
      </div>

      {/* Status text with icon animation */}
      <div className="text-center min-h-[32px]">
        {isListening && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-red-600 flex items-center gap-2 animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              सुन रहे हैं...
            </p>
            {/* Audio wave visualization */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {!isSupported && (
          <p className="text-sm text-destructive font-medium">
            वॉइस इनपुट उपलब्ध नहीं है
          </p>
        )}
        {!isListening && isSupported && (
          <p className="text-sm text-muted-foreground">
            🎤 माइक पर टैप करें और बोलें
          </p>
        )}
      </div>

      {/* Real-time transcript display with animation */}
      {interimTranscript && (
        <div className="w-full max-w-md p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-2">
            <Loader2 className="w-4 h-4 mt-1 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-gray-700 font-medium">
              {interimTranscript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
