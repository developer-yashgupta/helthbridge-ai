"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface VoiceOutputPreferencesProps {
  onPreferencesChange: (preferences: VoicePreferences) => void;
}

export interface VoicePreferences {
  autoPlay: boolean;
  rate: number;
  pitch: number;
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  autoPlay: false,
  rate: 1.0,
  pitch: 1.0,
};

const STORAGE_KEY = "voice-output-preferences";

export default function VoiceOutputPreferences({
  onPreferencesChange,
}: VoiceOutputPreferencesProps) {
  const [preferences, setPreferences] = useState<VoicePreferences>(DEFAULT_PREFERENCES);

  // Load preferences from session storage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as VoicePreferences;
          setPreferences(parsed);
          onPreferencesChange(parsed);
        }
      } catch (error) {
        console.error("Failed to load voice preferences:", error);
      }
    };

    loadPreferences();
  }, [onPreferencesChange]);

  // Save preferences to session storage whenever they change
  const updatePreferences = (newPreferences: Partial<VoicePreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save voice preferences:", error);
    }
    
    onPreferencesChange(updated);
  };

  const toggleAutoPlay = () => {
    updatePreferences({ autoPlay: !preferences.autoPlay });
  };

  const handleRateChange = (value: number[]) => {
    updatePreferences({ rate: value[0] });
  };

  const handlePitchChange = (value: number[]) => {
    updatePreferences({ pitch: value[0] });
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    sessionStorage.removeItem(STORAGE_KEY);
    onPreferencesChange(DEFAULT_PREFERENCES);
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">वॉइस सेटिंग्स</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          className="text-xs"
        >
          रीसेट करें
        </Button>
      </div>

      {/* Auto-play toggle */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="auto-play" className="cursor-pointer">
          ऑटो-प्ले {preferences.autoPlay ? "चालू" : "बंद"}
        </Label>
        <Switch
          id="auto-play"
          checked={preferences.autoPlay}
          onCheckedChange={toggleAutoPlay}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {preferences.autoPlay
          ? "जवाब स्वचालित रूप से बोले जाएंगे"
          : "जवाब सुनने के लिए प्ले बटन दबाएं"}
      </p>

      {/* Voice rate control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-rate">बोलने की गति</Label>
          <span className="text-sm text-muted-foreground">
            {preferences.rate.toFixed(1)}x
          </span>
        </div>
        <Slider
          id="voice-rate"
          min={0.5}
          max={2.0}
          step={0.1}
          value={[preferences.rate]}
          onValueChange={handleRateChange}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>धीमा (0.5x)</span>
          <span>सामान्य (1.0x)</span>
          <span>तेज़ (2.0x)</span>
        </div>
      </div>

      {/* Voice pitch control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-pitch">आवाज़ की ऊंचाई</Label>
          <span className="text-sm text-muted-foreground">
            {preferences.pitch.toFixed(1)}
          </span>
        </div>
        <Slider
          id="voice-pitch"
          min={0.5}
          max={2.0}
          step={0.1}
          value={[preferences.pitch]}
          onValueChange={handlePitchChange}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>नीची (0.5)</span>
          <span>सामान्य (1.0)</span>
          <span>ऊंची (2.0)</span>
        </div>
      </div>
    </div>
  );
}
