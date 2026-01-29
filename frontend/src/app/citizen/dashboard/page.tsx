"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Simple icons as text
const Icons = {
  Bell: () => <span>🔔</span>,
  LogOut: () => <span>🚪</span>,
  Languages: () => <span>🌐</span>,
  Mic: () => <span>🎤</span>,
  Camera: () => <span>📷</span>,
  FileAudio: () => <span>🎵</span>,
  Video: () => <span>📹</span>,
  Stethoscope: () => <span>🩺</span>,
  Upload: () => <span>📤</span>,
  UserCircle: () => <span>👤</span>,
  MapPin: () => <span>📍</span>,
  AlertTriangle: () => <span>⚠️</span>,
  HeartPulse: () => <span>💓</span>,
  ChevronRight: () => <span>▶️</span>,
  Download: () => <span>⬇️</span>,
  Siren: () => <span>🚨</span>,
  Loader: () => <span>⏳</span>,
};

// Types for better TypeScript support
interface AnalysisResult {
  riskLevel: string;
  possibleConditions: string[];
  whatToDo: string[];
  emergencySigns?: string;
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
            <Button variant="ghost" size="icon" aria-label="Switch Language">
              <Icons.Languages />
            </Button>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms) return;

    setIsAnalyzing(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        riskLevel: symptoms.toLowerCase().includes('fever') ? 'Medium' : 'Low',
        possibleConditions: ['Common Cold', 'Viral Infection'],
        whatToDo: ['Rest and hydration', 'Monitor symptoms', 'Consult doctor if worsens'],
        emergencySigns: symptoms.toLowerCase().includes('chest') ? 'Severe chest pain, difficulty breathing' : '',
      };
      setResult(mockResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>AI Health Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Describe your symptoms</Label>
              <textarea
                id="symptoms"
                placeholder="Apni problem likho... (Write your problem here...)"
                className="w-full min-h-[120px] p-3 border rounded-md"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzing}>
                <Icons.Mic /> Voice
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzing}>
                <Icons.Camera /> Photo
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzing}>
                <Icons.FileAudio /> Audio
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzing}>
                <Icons.Video /> Video
              </Button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isAnalyzing || !symptoms}>
              {isAnalyzing ? (
                <>
                  <Icons.Loader /> Analyzing...
                </>
              ) : (
                "Ask HealthBridge AI"
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { icon: Icons.Stethoscope, label: "Symptom Check", isEmergency: false },
    { icon: Icons.Upload, label: "Upload Report", isEmergency: false },
    { icon: Icons.UserCircle, label: "My Profile", isEmergency: false },
    { icon: Icons.MapPin, label: "Nearby PHC/SC", isEmergency: false },
    { icon: Icons.Siren, label: "Emergency Help", isEmergency: true },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 text-center">
        {actions.map(action => (
          <Button 
            key={action.label} 
            variant="ghost" 
            className={`flex flex-col h-auto items-center justify-center gap-1 p-2 text-center ${
              action.isEmergency ? 'bg-red-50 hover:bg-red-100' : ''
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
              action.isEmergency ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <action.icon />
            </div>
            <span className="text-xs font-medium text-wrap">{action.label}</span>
          </Button>
        ))}
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
          <span>AI Result</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(result.riskLevel)}`}>
            Risk Level: {result.riskLevel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Possible Conditions</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {result.possibleConditions.map((condition, i) => (
              <li key={i}>{condition}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">What to do now</h4>
          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
            {result.whatToDo.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        {result.emergencySigns && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <Icons.AlertTriangle />
              <div>
                <h4 className="font-semibold text-red-600">Emergency Signs</h4>
                <p className="text-sm text-red-700">{result.emergencySigns}</p>
              </div>
            </div>
          </div>
        )}

        {result.riskLevel === 'High' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="destructive" className="flex-1">Request ASHA help</Button>
            <Button variant="outline" className="flex-1">Send summary to PHC</Button>
          </div>
        )}
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
              <QuickActions />
              <VitalsCard />
              <HealthTips />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}