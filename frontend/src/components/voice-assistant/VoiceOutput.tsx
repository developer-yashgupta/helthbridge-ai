"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceOutputProps {
  text: string;
  language: string;
  autoPlay: boolean;
  rate?: number;
  pitch?: number;
  onComplete: () => void;
}

// Browser compatibility check for Web Speech Synthesis API
const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
};

export default function VoiceOutput({
  text,
  language,
  autoPlay,
  rate = 1.0,
  pitch = 1.0,
  onComplete,
}: VoiceOutputProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const supported = isSpeechSynthesisSupported();
    setIsSupported(supported);
  }, []);

  // Load available voices and select appropriate voice based on language
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) return;

      // Find voice matching the language
      let voice = voices.find((v) => v.lang.startsWith(language));
      
      // Fallback to default voice if language not found
      if (!voice) {
        voice = voices.find((v) => v.default) || voices[0];
      }

      setSelectedVoice(voice);
    };

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, language]);

  // Create utterance when text changes
  useEffect(() => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.lang = language || "hi-IN";
    utterance.rate = rate; // Use rate from props
    utterance.pitch = pitch; // Use pitch from props
    utterance.volume = 1.0; // Full volume

    // Set voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      onComplete();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utteranceRef.current = utterance;

    // Auto-play if enabled
    if (autoPlay) {
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      // Cleanup: cancel speech when component unmounts or text changes
      window.speechSynthesis.cancel();
    };
  }, [text, language, selectedVoice, autoPlay, rate, pitch, isSupported, onComplete]);

  // Speak function
  const speak = () => {
    if (!isSupported || !utteranceRef.current) return;

    if (isPaused) {
      // Resume if paused
      window.speechSynthesis.resume();
    } else {
      // Start speaking
      window.speechSynthesis.speak(utteranceRef.current);
    }
  };

  // Pause function
  const pause = () => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  };

  // Stop function
  const stop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Replay function
  const replay = () => {
    if (!isSupported || !utteranceRef.current) return;
    
    // Stop current speech
    window.speechSynthesis.cancel();
    
    // Speak again
    window.speechSynthesis.speak(utteranceRef.current);
  };

  // Don't render controls if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause button */}
      {!isSpeaking || isPaused ? (
        <Button
          onClick={speak}
          size="sm"
          variant="outline"
          className="rounded-full"
          aria-label="Play audio"
        >
          <Play className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={pause}
          size="sm"
          variant="outline"
          className="rounded-full"
          aria-label="Pause audio"
        >
          <Pause className="w-4 h-4" />
        </Button>
      )}

      {/* Stop button */}
      {isSpeaking && (
        <Button
          onClick={stop}
          size="sm"
          variant="outline"
          className="rounded-full"
          aria-label="Stop audio"
        >
          <VolumeX className="w-4 h-4" />
        </Button>
      )}

      {/* Replay button */}
      <Button
        onClick={replay}
        size="sm"
        variant="outline"
        className="rounded-full"
        aria-label="Replay audio"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      {/* Speaking indicator */}
      {isSpeaking && !isPaused && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>बोल रहे हैं...</span>
        </div>
      )}

      {/* Paused indicator */}
      {isPaused && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Pause className="w-4 h-4" />
          <span>रुका हुआ</span>
        </div>
      )}
    </div>
  );
}
