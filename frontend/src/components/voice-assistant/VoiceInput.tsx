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
      {/* Voice input button with visual indicator */}
      <Button
        onClick={toggleListening}
        disabled={!isSupported}
        size="lg"
        className={`relative w-16 h-16 rounded-full transition-all duration-300 ${isListening
          ? "bg-red-500 hover:bg-red-600 animate-pulse"
          : "bg-primary hover:bg-primary/90"
          }`}
        aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}

        {/* Pulsing ring indicator when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75" />
        )}
      </Button>

      {/* Status text */}
      <div className="text-center min-h-[24px]">
        {isListening && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            सुन रहे हैं...
          </p>
        )}
        {!isSupported && (
          <p className="text-sm text-destructive">
            वॉइस इनपुट उपलब्ध नहीं है
          </p>
        )}
      </div>

      {/* Real-time transcript display */}
      {interimTranscript && (
        <div className="w-full max-w-md p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground italic">
            {interimTranscript}
          </p>
        </div>
      )}
    </div>
  );
}
