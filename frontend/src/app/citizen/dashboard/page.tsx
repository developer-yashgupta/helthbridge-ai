"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/lib/api-service";
import { GoogleTranslate } from "@/components/GoogleTranslate";

// Simple icons as text
const Icons = {
  Bell: () => <span>🔔</span>,
  LogOut: () => <span>🚪</span>,
  Languages: () => <span>🌐</span>,
  Mic: () => <span>🎤</span>,
  Camera: () => <span>📷</span>,
  UserCircle: () => <span>👤</span>,
  AlertTriangle: () => <span>⚠️</span>,
  HeartPulse: () => <span>💓</span>,
  Loader: () => <span>⏳</span>,
};

// Types for better TypeScript support
interface AnalysisResult {
  riskLevel: string;
  possibleConditions: string[];
  whatToDo: string[];
  emergencySigns?: string;
  aiResponse?: string;
}

// Simple Header Component
const CitizenDashboardHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 text-primary">🏥</div>
            <span className="inline-block font-bold text-lg">HealthBridge AI</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-1">
            <GoogleTranslate />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Icons.Bell />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                <Icons.UserCircle />
              </div>
              <span className="hidden font-medium sm:inline-block">Prince</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Logout">
              <Icons.LogOut />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

// Welcome Card Component
const WelcomeCard = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-2xl">Hello Prince 👋</CardTitle>
          <CardDescription>How are you feeling today?</CardDescription>
        </div>
        <p className="text-xs text-muted-foreground pt-1 whitespace-nowrap">Last check: 2 days ago</p>
      </div>
    </CardHeader>
  </Card>
);

// Simple AI Health Query Component
const AIHealthQuery = ({ setResult }: { setResult: (result: AnalysisResult | null) => void }) => {
  const [symptoms, setSymptoms] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [uploadedImage, setUploadedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [chatHistory, setChatHistory] = React.useState<Array<{ type: 'user' | 'ai', message: string, timestamp: Date, image?: string }>>([
    {
      type: 'ai',
      message: "Hello! I'm your AI Health Assistant powered by advanced machine learning. I can analyze your symptoms and provide personalized health guidance. How are you feeling today?",
      timestamp: new Date()
    }
  ]);

  // Voice recognition setup
  const recognitionRef = React.useRef<any>(null);
  const speechSynthesisRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Text-to-Speech function - automatically speaks AI responses
  const speakText = (text: string) => {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Hindi
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  React.useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN'; // Hindi

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSymptoms(transcript);
          setIsListening(false);
          setVoiceError(null);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setVoiceError('आवाज़ समझने में समस्या। कृपया फिर से प्रयास करें।');
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('कृपया एक वैध इमेज फ़ाइल चुनें');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('इमेज का साइज़ 5MB से कम होना चाहिए');
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Analyze image with Gemini Vision
  const analyzeImage = async () => {
    if (!uploadedImage) return;

    setIsAnalyzingImage(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Add user message with image
        const userMessage = {
          type: 'user' as const,
          message: '📷 Image uploaded for analysis',
          timestamp: new Date(),
          image: base64Image
        };

        setChatHistory(prev => [...prev, userMessage]);

        // Call AI with image
        const imageAnalysisPrompt = `I've uploaded an image. Please analyze it and tell me what you see. If it's a medical image (rash, wound, prescription, report), provide relevant health guidance.`;

        try {
          const aiResult = await callAIEngine(imageAnalysisPrompt, base64Image);
          setResult(aiResult);

          const aiMessage = {
            type: 'ai' as const,
            message: aiResult.aiResponse || "I've analyzed the image. Please review the recommendations above.",
            timestamp: new Date()
          };

          setChatHistory(prev => [...prev, aiMessage]);

          // Speak the AI response
          if (aiResult.aiResponse) {
            speakText(aiResult.aiResponse);
          }

          // Clear image after analysis
          removeImage();

        } catch (error) {
          console.error('Error analyzing image:', error);
          const errorMessage = {
            type: 'ai' as const,
            message: "I'm sorry, I couldn't analyze the image. Please try again or describe your symptoms in text.",
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, errorMessage]);
          speakText(errorMessage.message);
        }
      };

      reader.readAsDataURL(uploadedImage);

    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      setVoiceError('वॉइस इनपुट इस ब्राउज़र में उपलब्ध नहीं है');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceError(null);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setVoiceError('माइक्रोफोन एक्सेस नहीं मिला');
      }
    }
  };

  const callAIEngine = async (userInput: string, imageData?: string): Promise<AnalysisResult> => {
    try {
      // Call the Python AI engine using the existing API service
      const response = await apiService.analyzeSymptoms({
        symptoms: userInput,
        inputType: imageData ? 'image' : 'text',
        language: 'en',
        patientAge: 25,
        patientGender: 'unknown',
        location: {
          district: 'Unknown',
          block: 'Unknown',
          village: 'Unknown'
        },
        imageData: imageData // Pass image data if available
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI analysis failed');
      }

      const aiData = response.data;

      // Use the actual AI response from the backend, or construct one if not available
      const mainAIResponse = aiData.aiResponse || `I've analyzed your input and here's what I found.`;

      // Transform AI engine response to our format
      return {
        riskLevel: aiData.riskLevel === 'red' ? 'High' : aiData.riskLevel === 'amber' ? 'Medium' : 'Low',
        possibleConditions: aiData.diseasePredictions?.map(p => p.disease) || [],
        whatToDo: aiData.recommendations || [],
        emergencySigns: aiData.followUpPlan?.red_flags?.join(', ') || '',
        aiResponse: mainAIResponse
      };

    } catch (error) {
      console.error('AI Engine connection failed:', error);

      // Fallback to local processing if AI engine is unavailable
      return {
        riskLevel: 'Low',
        possibleConditions: ['AI Engine Unavailable'],
        whatToDo: [
          'AI engine is currently unavailable',
          'Please try again in a moment',
          'If symptoms are severe, consult a healthcare provider immediately'
        ],
        aiResponse: `I apologize, but I'm having trouble connecting to the AI analysis engine right now. This might be because the AI service is starting up or temporarily unavailable.

**Your message:** "${userInput}"

**What this means:** The machine learning models that power my analysis are currently offline. This could be due to:
- The AI service is starting up (this can take a few minutes)
- Temporary network connectivity issues
- The AI engine is being updated

**What you should do:**
- If this is an emergency or you have severe symptoms, please seek immediate medical attention or call emergency services
- For non-urgent symptoms, please try again in a few moments

**Alternative options:**
- Contact an ASHA worker in your area
- Visit your nearest Primary Health Centre (PHC)
- Call a healthcare helpline

I'll be back online as soon as the AI engine is available. Thank you for your patience!`
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);

    // Add user message to chat
    const userMessage = {
      type: 'user' as const,
      message: symptoms,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    try {
      // Call the real AI engine
      const aiResult = await callAIEngine(symptoms);
      setResult(aiResult);

      // Add AI response to chat
      const aiMessage = {
        type: 'ai' as const,
        message: aiResult.aiResponse || "I've analyzed your symptoms and provided recommendations above. Please review them carefully.",
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
      setSymptoms("");

      // Speak the AI response automatically
      if (aiResult.aiResponse) {
        speakText(aiResult.aiResponse);
      }

    } catch (error) {
      console.error('Error processing AI request:', error);

      // Add error message to chat
      const errorMessage = {
        type: 'ai' as const,
        message: "I'm sorry, I encountered an error while processing your request. Please try again or consult a healthcare provider if your symptoms are concerning.",
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, errorMessage]);
      
      // Speak error message automatically
      speakText(errorMessage.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI Health Assistant
          <span className="text-sm font-normal text-green-600">● ML Powered</span>
          {isSpeaking && (
            <span className="text-sm font-normal text-blue-600 animate-pulse">🔊 बोल रहा है...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chat History */}
          <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${chat.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border shadow-sm'
                  }`}>
                  {chat.image && (
                    <img 
                      src={chat.image} 
                      alt="Uploaded" 
                      className="max-w-full h-auto rounded-md mb-2 max-h-40 object-contain"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                  <p className={`text-xs mt-1 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`} suppressHydrationWarning>
                    {chat.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <Icons.Loader /> AI is analyzing your symptoms with machine learning...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label htmlFor="symptoms">Describe how you're feeling</Label>
              {isListening && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm text-red-600 font-medium">सुन रहे हैं... बोलें</span>
                </div>
              )}
              <textarea
                id="symptoms"
                placeholder="Hi, I'm feeling tired and have a headache... (The AI will analyze your symptoms using machine learning)"
                className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                disabled={isAnalyzing || isListening}
              />

              {/* Voice Error Display */}
              {voiceError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {voiceError}
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                  >
                    ✕
                  </button>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-auto rounded-md max-h-40 object-contain mx-auto"
                  />
                  <p className="text-xs text-blue-600 text-center mt-2">
                    📷 Image ready for analysis
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" 
                  variant={isListening ? "default" : "outline"} 
                  size="sm" 
                  disabled={isAnalyzing || isAnalyzingImage}
                  onClick={toggleVoiceListening}
                  className={isListening ? "animate-pulse bg-red-500 hover:bg-red-600" : ""}
                >
                  <Icons.Mic /> {isListening ? "सुन रहे हैं..." : "Voice"}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={isAnalyzing || isAnalyzingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icons.Camera /> Photo
                </Button>

                {uploadedImage && (
                  <Button 
                    type="button" 
                    variant="default" 
                    size="sm" 
                    disabled={isAnalyzingImage}
                    onClick={analyzeImage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isAnalyzingImage ? (
                      <>
                        <Icons.Loader /> Analyzing...
                      </>
                    ) : (
                      <>🔍 Analyze Image</>
                    )}
                  </Button>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isAnalyzing || !symptoms.trim()}>
                {isAnalyzing ? (
                  <>
                    <Icons.Loader /> Analyzing with AI...
                  </>
                ) : (
                  "Ask AI Health Assistant"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

// AI Result Component
const AIResult = ({ result }: { result: AnalysisResult | null }) => {
  if (!result) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>🩺 Health Analysis</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(result.riskLevel)}`}>
            Risk Level: {result.riskLevel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Response - Most prominent */}
        {result.aiResponse && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">🤖</div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">AI Health Assistant Says:</h4>
                <p className="text-blue-700 leading-relaxed">{result.aiResponse}</p>
              </div>
            </div>
          </div>
        )}

        {/* Possible Conditions */}
        {result.possibleConditions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              🔍 Possible Conditions
            </h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {result.possibleConditions.map((condition, i) => (
                <li key={i}>{condition}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {result.whatToDo.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              💡 Recommended Actions
            </h4>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              {result.whatToDo.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Emergency Signs */}
        {result.emergencySigns && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <Icons.AlertTriangle />
              <div>
                <h4 className="font-semibold text-red-600">⚠️ Seek Immediate Medical Attention If:</h4>
                <p className="text-sm text-red-700 mt-1">{result.emergencySigns}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {result.riskLevel === 'High' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="destructive" className="flex-1">🚨 Request Emergency Help</Button>
            <Button variant="outline" className="flex-1">📞 Call Healthcare Provider</Button>
          </div>
        )}

        {result.riskLevel === 'Medium' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1">👩‍⚕️ Consult ASHA Worker</Button>
            <Button variant="outline" className="flex-1">🏥 Find Nearby PHC</Button>
          </div>
        )}

        {/* Follow-up suggestion */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-gray-600 mb-2">Need more help?</p>
          <Button variant="ghost" size="sm" className="text-blue-600">
            💬 Continue Conversation with AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Vitals Card Component
const VitalsCard = () => {
  const [isDiabetic, setIsDiabetic] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.HeartPulse /> Vitals Quick Input
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="temp">Temperature (°F)</Label>
            <Input id="temp" placeholder="98.6" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="spo2">SpO2 (%)</Label>
            <Input id="spo2" placeholder="99" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="bp">BP (SYS/DIA)</Label>
          <Input id="bp" placeholder="120/80" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Label htmlFor="is-diabetic" className="cursor-pointer">
            Are you diabetic?
          </Label>
          <input
            type="checkbox"
            id="is-diabetic"
            checked={isDiabetic}
            onChange={(e) => setIsDiabetic(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        {isDiabetic && (
          <div className="space-y-1 pt-2">
            <Label htmlFor="sugar">Sugar (mg/dL)</Label>
            <Input id="sugar" placeholder="100" />
          </div>
        )}
        <Button className="w-full">Add Vitals</Button>
      </CardContent>
    </Card>
  );
};

// Health Tips Component
const HealthTips = () => {
  const tips = [
    { title: "Winter Cough-Care", content: "Stay warm and hydrated. Use a humidifier to ease your throat." },
    { title: "Dengue Prevention", content: "Don't let water stagnate near your house. Use mosquito nets." },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Health Tips & Awareness</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="p-3 rounded-lg border bg-gray-50">
            <p className="font-semibold">{tip.title}</p>
            <p className="text-sm text-muted-foreground">{tip.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export default function CitizenDashboard() {
  const [aiResult, setAiResult] = React.useState<AnalysisResult | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <CitizenDashboardHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <WelcomeCard />
              <AIHealthQuery setResult={setAiResult} />
              {aiResult && <AIResult result={aiResult} />}
            </div>
            <div className="lg:col-span-2 space-y-6">
              <VitalsCard />
              <HealthTips />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}