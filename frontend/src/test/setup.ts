import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock Web Speech API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  maxAlternatives = 1;

  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start() {
    if (this.onstart) {
      this.onstart();
    }
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }

  abort() {
    if (this.onend) {
      this.onend();
    }
  }
}

// Add to global window object
(global as any).SpeechRecognition = MockSpeechRecognition;
(global as any).webkitSpeechRecognition = MockSpeechRecognition;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [],
    }),
  },
  writable: true,
});
