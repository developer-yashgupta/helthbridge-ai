# Voice Assistant Components

## VoiceInput Component

A React component that provides voice input functionality using the Web Speech API for the Voice Healthcare Assistant feature.

### Features

#### Task 8.1: Web Speech API Integration
- ✅ Browser compatibility check for Web Speech API
- ✅ Microphone permission request handling
- ✅ Visual indicator for recording state (pulsing animation)
- ✅ Start/stop recording functions
- ✅ Error handling for unsupported browsers
- ✅ Comprehensive unit tests (12 tests)

#### Task 8.2: Speech-to-Text Conversion
- ✅ Language support configuration (Hindi, English, regional languages)
- ✅ Real-time transcription updates with interim results
- ✅ Final transcript extraction
- ✅ Confidence score checking (threshold: 0.5)
- ✅ Error handling with fallback for various error types
- ✅ Comprehensive unit tests (17 tests)

### Usage

```tsx
import VoiceInput from "@/components/voice-assistant/VoiceInput";

function MyComponent() {
  const [isListening, setIsListening] = useState(false);

  const handleTranscript = (text: string) => {
    console.log("User said:", text);
  };

  const handleError = (error: string) => {
    console.error("Voice error:", error);
  };

  return (
    <VoiceInput
      onTranscript={handleTranscript}
      onError={handleError}
      language="hi-IN"
      isListening={isListening}
      onListeningChange={setIsListening}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onTranscript` | `(text: string) => void` | Callback when final transcript is available |
| `onError` | `(error: string) => void` | Callback when an error occurs |
| `language` | `string` | Language code (e.g., "hi-IN", "en-US") |
| `isListening` | `boolean` | Current listening state |
| `onListeningChange` | `(listening: boolean) => void` | Callback when listening state changes |

### Supported Languages

- Hindi: `hi-IN`
- English (US): `en-US`
- English (UK): `en-GB`
- And other languages supported by Web Speech API

### Browser Support

- Chrome/Edge: Full support
- Safari: Full support
- Firefox: Limited support
- Other browsers: Fallback to text input

### Error Handling

The component handles various error scenarios:

- **no-speech**: No audio detected
- **audio-capture**: Microphone access failed
- **not-allowed**: Permission denied
- **network**: Network connectivity issues
- **aborted**: User cancelled (not treated as error)

All errors are displayed in Hindi with user-friendly messages.

### Testing

Run tests with:

```bash
npm test -- VoiceInput
```

Total: 29 tests covering:
- Component rendering
- Browser compatibility
- Microphone permissions
- Recording state management
- Language configuration
- Real-time transcription
- Confidence scoring
- Error handling

### Implementation Details

- Uses Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Continuous listening mode for natural conversation
- Interim results for real-time feedback
- Confidence threshold of 0.5 to filter low-quality transcripts
- Automatic cleanup on component unmount
- Responsive UI with Tailwind CSS
- Accessible with ARIA labels

### Next Steps

This component will be integrated into the main VoiceHealthcareAssistant container component (Task 11) along with:
- VoiceOutput component (Task 9)
- ConversationDisplay component (Task 10)
