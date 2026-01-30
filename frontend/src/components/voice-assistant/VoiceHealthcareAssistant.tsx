"use client";

import { useState, useCallback, useEffect } from "react";
import VoiceInput from "./VoiceInput";
import VoiceOutput from "./VoiceOutput";
import ConversationDisplay, { Message, RoutingDecision } from "./ConversationDisplay";
import VoiceOutputPreferences from "./VoiceOutputPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, History, Languages } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { voiceAssistantAPI, AnalyzeMessageRequest, ConversationSummary } from "@/lib/voice-assistant-api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceHealthcareAssistantProps {
  userId: string;
  userLanguage?: string;
  patientInfo?: {
    age?: number;
    gender?: string;
    location?: {
      lat: number;
      lng: number;
    };
    medicalHistory?: string[];
  };
  loadHistory?: boolean;
  enableLanguageSelection?: boolean;
  onClose?: () => void;
}

interface AssistantState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  conversation: Message[];
  currentTranscript: string;
  error: string | null;
  voiceEnabled: boolean;
  conversationId: string | null;
}

export default function VoiceHealthcareAssistant({
  userId,
  userLanguage = "hi-IN",
  patientInfo = {},
  loadHistory = false,
  enableLanguageSelection = false,
  onClose,
}: VoiceHealthcareAssistantProps) {
  const [state, setState] = useState<AssistantState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    conversation: [],
    currentTranscript: "",
    error: null,
    voiceEnabled: false,
    conversationId: null,
  });

  const [textInput, setTextInput] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(userLanguage);
  const historyLimit = 20;

  // Supported languages
  const supportedLanguages = [
    { code: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "en-US", label: "English", flag: "🇺🇸" },
    { code: "bn-IN", label: "বাংলা (Bengali)", flag: "🇮🇳" },
    { code: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { code: "mr-IN", label: "मराठी (Marathi)", flag: "🇮🇳" },
    { code: "ta-IN", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  ];

  // Initialize conversation on mount
  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: "नमस्ते! मैं आपका स्वास्थ्य सहायक हूं। आप कैसा महसूस कर रहे हैं?",
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      conversation: [welcomeMessage],
    }));

    // Load conversation history if enabled
    if (loadHistory) {
      loadConversationHistory();
    }
  }, [loadHistory]);

  // Load conversation history
  const loadConversationHistory = async (offset: number = 0) => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await voiceAssistantAPI.getConversationHistory(
        userId,
        historyLimit,
        offset,
        'active'
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to load history');
      }

      setConversationHistory((prev) => 
        offset === 0 ? response.conversations : [...prev, ...response.conversations]
      );
      setHistoryOffset(offset + historyLimit);
      setHasMoreHistory(response.conversations.length === historyLimit);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setHistoryError('इतिहास लोड करने में त्रुटि');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load more history (pagination)
  const loadMoreHistory = () => {
    if (!isLoadingHistory && hasMoreHistory) {
      loadConversationHistory(historyOffset);
    }
  };

  // Switch to a previous conversation
  const switchToConversation = async (conversationId: string) => {
    try {
      const response = await voiceAssistantAPI.getConversation(conversationId, userId);

      if (!response.success || !response.conversation) {
        throw new Error(response.error || 'Failed to load conversation');
      }

      // Convert conversation messages to Message format
      const messages: Message[] = response.conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata,
      }));

      setState((prev) => ({
        ...prev,
        conversation: messages,
        conversationId: response.conversation.id,
      }));
    } catch (error) {
      console.error('Error switching conversation:', error);
      setState((prev) => ({
        ...prev,
        error: 'बातचीत लोड करने में त्रुटि',
      }));
    }
  };

  // Format date for history display
  const formatHistoryDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'आज';
    } else if (diffInDays === 1) {
      return 'कल';
    } else if (diffInDays < 7) {
      return `${diffInDays} दिन पहले`;
    } else {
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    
    // Add system message about language change
    const languageLabel = supportedLanguages.find(l => l.code === language)?.label || language;
    const systemMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "system",
      content: `भाषा बदल दी गई: ${languageLabel}`,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      conversation: [...prev.conversation, systemMessage],
    }));
  };

  // Handle voice transcript
  const handleTranscript = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      currentTranscript: text,
      isListening: false,
    }));

    // Automatically submit the transcript
    submitMessage(text);
  }, []);

  // Handle voice input error
  const handleVoiceError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      isListening: false,
    }));

    // Clear error after 5 seconds
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        error: null,
      }));
    }, 5000);
  }, []);

  // Handle listening state change
  const handleListeningChange = useCallback((listening: boolean) => {
    setState((prev) => ({
      ...prev,
      isListening: listening,
      error: listening ? null : prev.error,
    }));
  }, []);

  // Handle voice output complete
  const handleVoiceOutputComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSpeaking: false,
    }));
  }, []);

  // Handle voice preference change
  const handleVoicePreferenceChange = useCallback((preferences: { autoPlay: boolean; rate: number; pitch: number }) => {
    setState((prev) => ({
      ...prev,
      voiceEnabled: preferences.autoPlay,
    }));
  }, []);

  // Submit message (voice or text)
  const submitMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to conversation
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      conversation: [...prev.conversation, userMessage],
      isProcessing: true,
      error: null,
    }));

    // Clear text input
    setTextInput("");

    try {
      // Prepare API request
      const request: AnalyzeMessageRequest = {
        userId,
        message: message.trim(),
        conversationId: state.conversationId || undefined,
        language: selectedLanguage.split('-')[0], // Extract language code (hi from hi-IN)
        patientInfo,
      };

      // Call API to analyze message
      const response = await voiceAssistantAPI.analyzeMessage(request);

      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze message');
      }

      // Create routing decision from response
      const routing: RoutingDecision = {
        facility: response.routing.facilityType,
        severity: response.routing.severity,
        contactInfo: response.routing.facility ? {
          name: response.routing.facility.name,
          phone: response.routing.facility.phone || '',
          address: response.routing.facility.address || '',
          distance: response.routing.facility.distance,
        } : undefined,
        reasoning: response.routing.reasoning,
      };

      // Add assistant message with routing
      const assistantMessage: Message = {
        id: response.messageId,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        routing,
      };

      setState((prev) => ({
        ...prev,
        conversation: [...prev.conversation, assistantMessage],
        conversationId: response.conversationId,
        isProcessing: false,
        isSpeaking: prev.voiceEnabled,
      }));

      setCurrentResponse(response.response);
    } catch (error) {
      console.error("Error submitting message:", error);
      
      // Determine user-friendly error message
      let errorMessage = "संदेश भेजने में त्रुटि। कृपया पुनः प्रयास करें।";
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "इंटरनेट कनेक्शन की जांच करें और पुनः प्रयास करें।";
        } else if (error.message.includes('timeout')) {
          errorMessage = "सर्वर प्रतिक्रिया में देरी हो रही है। कृपया पुनः प्रयास करें।";
        }
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
      }));
    }
  };

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      submitMessage(textInput);
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">स्वास्थ्य सहायक</CardTitle>
          <div className="flex items-center gap-2">
            {enableLanguageSelection && (
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]" aria-label="Select language">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {loadHistory && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="View history">
                    <History className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>बातचीत का इतिहास</SheetTitle>
                    <SheetDescription>
                      अपनी पिछली बातचीत देखें
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {historyError && (
                      <Alert variant="destructive">
                        <AlertDescription>{historyError}</AlertDescription>
                      </Alert>
                    )}
                    {conversationHistory.length === 0 && !isLoadingHistory && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        कोई पिछली बातचीत नहीं मिली
                      </p>
                    )}
                    {conversationHistory.map((conv) => (
                      <Button
                        key={conv.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => switchToConversation(conv.id)}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="font-medium text-sm">
                            {conv.title || 'बातचीत'}
                          </div>
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{formatHistoryDate(conv.last_message_at)}</span>
                            <span>{conv.message_count} संदेश</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                    {hasMoreHistory && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadMoreHistory}
                        disabled={isLoadingHistory}
                      >
                        {isLoadingHistory ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            लोड हो रहा है...
                          </>
                        ) : (
                          'और लोड करें'
                        )}
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <VoiceOutputPreferences
              onPreferencesChange={handleVoicePreferenceChange}
            />
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Error display */}
        {state.error && (
          <div className="p-4 border-b">
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Conversation display */}
        <div className="flex-1 overflow-hidden">
          <ConversationDisplay
            messages={state.conversation}
            isLoading={state.isProcessing}
          />
        </div>

        {/* Voice output (hidden, plays audio) */}
        {state.isSpeaking && currentResponse && (
          <div className="px-4 py-2 border-t bg-muted/50">
            <VoiceOutput
              text={currentResponse}
              language={selectedLanguage}
              autoPlay={state.voiceEnabled}
              onComplete={handleVoiceOutputComplete}
            />
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t bg-background">
          <div className="flex flex-col gap-4">
            {/* Voice input */}
            <div className="flex justify-center">
              <VoiceInput
                onTranscript={handleTranscript}
                onError={handleVoiceError}
                language={selectedLanguage}
                isListening={state.isListening}
                onListeningChange={handleListeningChange}
              />
            </div>

            {/* Text input fallback */}
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="या यहाँ टाइप करें..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={state.isProcessing || state.isListening}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={
                  !textInput.trim() || state.isProcessing || state.isListening
                }
                size="icon"
              >
                {state.isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
