import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceOutputPreferences, {
  VoicePreferences,
} from "./VoiceOutputPreferences";

describe("VoiceOutputPreferences Component", () => {
  const mockOnPreferencesChange = vi.fn();

  const defaultProps = {
    onPreferencesChange: mockOnPreferencesChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render preferences component", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText(/वॉइस सेटिंग्स/)).toBeInTheDocument();
      expect(screen.getByLabelText(/ऑटो-प्ले/)).toBeInTheDocument();
      expect(screen.getByText(/बोलने की गति/)).toBeInTheDocument();
      expect(screen.getByText(/आवाज़ की ऊंचाई/)).toBeInTheDocument();
    });

    it("should render reset button", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText(/रीसेट करें/)).toBeInTheDocument();
    });

    it("should show default preferences", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      // Auto-play should be off by default
      const autoPlaySwitch = screen.getByRole("switch");
      expect(autoPlaySwitch).not.toBeChecked();

      // Rate should be 1.0x
      expect(screen.getByText("1.0x")).toBeInTheDocument();

      // Pitch should be 1.0
      expect(screen.getByText("1.0")).toBeInTheDocument();
    });
  });

  describe("Auto-play Toggle", () => {
    it("should toggle auto-play on", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(autoPlaySwitch).toBeChecked();
      expect(mockOnPreferencesChange).toHaveBeenCalledWith(
        expect.objectContaining({ autoPlay: true })
      );
    });

    it("should toggle auto-play off", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      
      // Turn on
      fireEvent.click(autoPlaySwitch);
      expect(autoPlaySwitch).toBeChecked();

      // Turn off
      fireEvent.click(autoPlaySwitch);
      expect(autoPlaySwitch).not.toBeChecked();
      
      expect(mockOnPreferencesChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ autoPlay: false })
      );
    });

    it("should show appropriate message when auto-play is on", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(
        screen.getByText(/जवाब स्वचालित रूप से बोले जाएंगे/)
      ).toBeInTheDocument();
    });

    it("should show appropriate message when auto-play is off", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(
        screen.getByText(/जवाब सुनने के लिए प्ले बटन दबाएं/)
      ).toBeInTheDocument();
    });
  });

  describe("Voice Rate Control", () => {
    it("should display current rate value", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText("1.0x")).toBeInTheDocument();
    });

    it("should show rate range labels", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText(/धीमा \(0.5x\)/)).toBeInTheDocument();
      expect(screen.getByText(/सामान्य \(1.0x\)/)).toBeInTheDocument();
      expect(screen.getByText(/तेज़ \(2.0x\)/)).toBeInTheDocument();
    });

    it("should render rate slider with correct attributes", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const sliders = screen.getAllByRole("slider");
      const rateSlider = sliders[0]; // First slider is rate
      
      expect(rateSlider).toHaveAttribute("aria-valuemin", "0.5");
      expect(rateSlider).toHaveAttribute("aria-valuemax", "2");
      expect(rateSlider).toHaveAttribute("aria-valuenow", "1");
    });
  });

  describe("Voice Pitch Control", () => {
    it("should display current pitch value", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText("1.0")).toBeInTheDocument();
    });

    it("should show pitch range labels", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(screen.getByText(/नीची \(0.5\)/)).toBeInTheDocument();
      expect(screen.getByText(/सामान्य \(1.0\)/)).toBeInTheDocument();
      expect(screen.getByText(/ऊंची \(2.0\)/)).toBeInTheDocument();
    });

    it("should render pitch slider with correct attributes", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const sliders = screen.getAllByRole("slider");
      const pitchSlider = sliders[1]; // Second slider is pitch
      
      expect(pitchSlider).toHaveAttribute("aria-valuemin", "0.5");
      expect(pitchSlider).toHaveAttribute("aria-valuemax", "2");
      expect(pitchSlider).toHaveAttribute("aria-valuenow", "1");
    });
  });

  describe("Session Storage", () => {
    it("should save preferences to session storage", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      const stored = sessionStorage.getItem("voice-output-preferences");
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored) as VoicePreferences;
        expect(parsed.autoPlay).toBe(true);
      }
    });

    it("should load preferences from session storage on mount", async () => {
      const savedPreferences: VoicePreferences = {
        autoPlay: true,
        rate: 1.5,
        pitch: 1.2,
      };

      sessionStorage.setItem(
        "voice-output-preferences",
        JSON.stringify(savedPreferences)
      );

      render(<VoiceOutputPreferences {...defaultProps} />);

      await waitFor(() => {
        expect(mockOnPreferencesChange).toHaveBeenCalledWith(savedPreferences);
      });

      const autoPlaySwitch = screen.getByRole("switch");
      expect(autoPlaySwitch).toBeChecked();
    });

    it("should handle corrupted session storage data", () => {
      sessionStorage.setItem("voice-output-preferences", "invalid json");

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<VoiceOutputPreferences {...defaultProps} />);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should handle session storage errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock sessionStorage.setItem to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error("Storage quota exceeded");
      });

      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Reset Functionality", () => {
    it("should reset preferences to defaults", async () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      // Change some preferences
      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(autoPlaySwitch).toBeChecked();

      // Reset
      const resetButton = screen.getByText(/रीसेट करें/);
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(autoPlaySwitch).not.toBeChecked();
      });

      expect(mockOnPreferencesChange).toHaveBeenLastCalledWith({
        autoPlay: false,
        rate: 1.0,
        pitch: 1.0,
      });
    });

    it("should clear session storage on reset", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      // Set some preferences
      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(sessionStorage.getItem("voice-output-preferences")).not.toBeNull();

      // Reset
      const resetButton = screen.getByText(/रीसेट करें/);
      fireEvent.click(resetButton);

      expect(sessionStorage.getItem("voice-output-preferences")).toBeNull();
    });
  });

  describe("Callback Invocation", () => {
    it("should call onPreferencesChange when any preference changes", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(mockOnPreferencesChange).toHaveBeenCalled();
    });

    it("should pass complete preferences object to callback", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      expect(mockOnPreferencesChange).toHaveBeenCalledWith({
        autoPlay: true,
        rate: 1.0,
        pitch: 1.0,
      });
    });
  });

  describe("Visual Indicators", () => {
    it("should show volume icon when auto-play is on", async () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      const autoPlaySwitch = screen.getByRole("switch");
      fireEvent.click(autoPlaySwitch);

      // Wait for state update and check for Volume2 icon (when auto-play is on)
      await waitFor(() => {
        const volumeIcon = document.querySelector(".lucide-volume2");
        expect(volumeIcon).toBeInTheDocument();
      });
    });

    it("should show muted icon when auto-play is off", () => {
      render(<VoiceOutputPreferences {...defaultProps} />);

      // Check for VolumeX icon (when auto-play is off)
      const mutedIcon = document.querySelector(".lucide-volume-x");
      expect(mutedIcon).toBeInTheDocument();
    });
  });
});
