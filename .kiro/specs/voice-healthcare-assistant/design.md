# Voice Healthcare Assistant Design Document

## Overview

The Voice Healthcare Assistant is a comprehensive voice-operated AI system that integrates OpenAI's API to provide intelligent healthcare responses with automatic routing to appropriate healthcare facilities (ASHA workers, PHC, CHC) based on symptom severity. The system supports voice input/output, maintains conversation history in the backend, and notifies healthcare workers when patients are referred to them.

This is a new implementation built from scratch, separate from the existing ai-engine, designed to integrate seamlessly with the existing HealthBridge backend infrastructure.

### Key Features
- Voice input using Web Speech API
- OpenAI API integration for healthcare-specific responses
- Intelligent symptom analysis and severity assessment
- Automatic routing: ASHA → PHC → CHC based on priority
- Healthcare worker notification system
- Conversation history persistence
- Text-to-speech output
- Multi-language support (Hindi, English, and regional languages)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Voice Input  │  │ Chat UI      │  │ Voice Output │      │
│  │ (Web Speech) │  │ Component    │  │ (TTS)        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express.js)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Voice Assistant Routes & Controllers         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OpenAI       │  │ Routing      │  │ Notification │      │
│  │ Service      │  │ Engine       │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - conversations          - routing_decisions                │
│  - conversation_messages  - worker_notifications             │
│  - symptom_analyses       - healthcare_resources             │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User speaks → Web Speech API → Text transcription
                                      ↓
                            Backend API receives text
                                      ↓
                            OpenAI Service analyzes
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            Symptom Analysis                    Generate Response
            Severity Assessment                 Healthcare Advice
                    ↓                                   ↓
            Routing Engine                      Save to Database
            (ASHA/PHC/CHC)                      (conversation history)
                    ↓                                   ↓
            Notification Service                Return to Frontend
            (Alert workers)                             ↓
                                                Display + TTS
```

## Components and Interfaces

### 1. Frontend Components

#### 1.1 VoiceHealthcareAssistant Component
Main container component that orchestrates the voice assistant interface.

**Location:** `frontend/src/components/voice-assistant/VoiceHealthcareAssistant.tsx`

**Props:**
```typescript
interface VoiceHealthcareAssistantProps {
  userId: string;
  userLanguage: string;
  onClose?: () => void;
}
```

**State:**
```typescript
interface AssistantState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  conversation: Message[];
  currentTranscript: string;
  error: string | null;
  voiceEnabled: boolean;
}
```

#### 1.2 VoiceInput Component
Handles voice recording and speech-to-text conversion.

**Location:** `frontend/src/components/voice-assistant/VoiceInput.tsx`

**Interface:**
```typescript
interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  language: string;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}
```

**Methods:**
- `startListening()`: Activates microphone and begins recording
- `stopListening()`: Stops recording and processes audio
- `handleSpeechRecognition()`: Processes speech recognition results

#### 1.3 ConversationDisplay Component
Displays the chat interface with messages.

**Location:** `frontend/src/components/voice-assistant/ConversationDisplay.tsx`

**Interface:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  routing?: RoutingDecision;
  metadata?: MessageMetadata;
}

interface RoutingDecision {
  facility: 'ASHA' | 'PHC' | 'CHC' | 'EMERGENCY';
  severity: 'low' | 'medium' | 'high' | 'critical';
  contactInfo: FacilityContact;
  reasoning: string;
}
```

#### 1.4 VoiceOutput Component
Handles text-to-speech functionality.

**Location:** `frontend/src/components/voice-assistant/VoiceOutput.tsx`

**Interface:**
```typescript
interface VoiceOutputProps {
  text: string;
  language: string;
  autoPlay: boolean;
  onComplete: () => void;
}
```

**Methods:**
- `speak(text: string)`: Converts text to speech
- `pause()`: Pauses current speech
- `resume()`: Resumes paused speech
- `stop()`: Stops speech playback

### 2. Backend Services

#### 2.1 OpenAI Service
Handles all interactions with OpenAI API.

**Location:** `backend/services/openaiService.js`

**Methods:**
```javascript
class OpenAIService {
  async analyzeSymptoms(userMessage, conversationHistory, userContext)
  async generateHealthcareResponse(analysis, userLanguage)
  async assessSeverity(symptoms, patientInfo)
  async streamResponse(prompt, onChunk)
}
```

**Configuration:**
```javascript
{
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: HEALTHCARE_SYSTEM_PROMPT
}
```

#### 2.2 Routing Engine Service
Determines appropriate healthcare facility based on severity.

**Location:** `backend/services/routingEngine.js`

**Methods:**
```javascript
class RoutingEngine {
  async determineRouting(severityLevel, symptoms, userLocation)
  async findNearestFacility(facilityType, userLocation)
  async checkFacilityAvailability(facilityId)
  async calculatePriority(symptoms, patientInfo, medicalHistory)
}
```

**Routing Logic:**
```javascript
{
  severity: 'low' (0-40) → ASHA Worker
  severity: 'medium' (41-60) → PHC
  severity: 'high' (61-80) → CHC
  severity: 'critical' (81-100) → Emergency Services
}
```

#### 2.3 Notification Service
Sends notifications to healthcare workers.

**Location:** `backend/services/notificationService.js`

**Methods:**
```javascript
class NotificationService {
  async notifyWorker(workerId, patientInfo, symptoms, severity)
  async notifyFacility(facilityId, referralDetails)
  async sendSMS(phoneNumber, message)
  async sendInAppNotification(userId, notification)
  async logNotification(notificationData)
}
```

#### 2.4 Conversation Service
Manages conversation persistence and retrieval.

**Location:** `backend/services/conversationService.js`

**Methods:**
```javascript
class ConversationService {
  async createConversation(userId, metadata)
  async addMessage(conversationId, role, content, metadata)
  async getConversationHistory(userId, limit, offset)
  async getConversation(conversationId)
  async updateConversationMetadata(conversationId, metadata)
}
```

### 3. API Routes

#### 3.1 Voice Assistant Routes
**Location:** `backend/routes/voiceAssistant.js`

**Endpoints:**

```javascript
POST /api/voice-assistant/analyze
// Analyzes user message and returns AI response with routing
Request: {
  userId: string,
  message: string,
  conversationId?: string,
  language: string,
  patientInfo: {
    age: number,
    gender: string,
    location: { lat: number, lng: number }
  }
}
Response: {
  success: boolean,
  response: string,
  routing: RoutingDecision,
  conversationId: string,
  messageId: string
}

GET /api/voice-assistant/conversations/:userId
// Retrieves conversation history for a user
Response: {
  success: boolean,
  conversations: Conversation[]
}

GET /api/voice-assistant/conversation/:conversationId
// Retrieves specific conversation with all messages
Response: {
  success: boolean,
  conversation: ConversationDetail
}

POST /api/voice-assistant/feedback
// Submits feedback on AI response
Request: {
  messageId: string,
  rating: number,
  feedback: string
}
```

#### 3.2 Worker Notification Routes
**Location:** `backend/routes/workerNotifications.js`

**Endpoints:**

```javascript
GET /api/worker-notifications/:workerId
// Gets notifications for a healthcare worker
Response: {
  success: boolean,
  notifications: Notification[]
}

PUT /api/worker-notifications/:notificationId/acknowledge
// Acknowledges receipt of notification
Request: {
  workerId: string,
  response: string
}

GET /api/worker-notifications/stats/:workerId
// Gets notification statistics for worker
Response: {
  success: boolean,
  stats: {
    pending: number,
    acknowledged: number,
    avgResponseTime: string
  }
}
```

## Data Models

### Database Schema Extensions

#### conversations table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(200),
    language VARCHAR(5) DEFAULT 'hi',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

#### conversation_messages table
```sql
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'voice')),
    voice_duration INTEGER, -- in seconds, if voice message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at);
```

#### routing_decisions table
```sql
CREATE TABLE routing_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES conversation_messages(id),
    user_id UUID REFERENCES users(id),
    symptoms JSONB NOT NULL,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    severity_score INTEGER NOT NULL CHECK (severity_score >= 0 AND severity_score <= 100),
    recommended_facility VARCHAR(20) NOT NULL CHECK (recommended_facility IN ('ASHA', 'PHC', 'CHC', 'EMERGENCY')),
    facility_id UUID REFERENCES healthcare_resources(id),
    reasoning TEXT NOT NULL,
    ai_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routing_user_id ON routing_decisions(user_id);
CREATE INDEX idx_routing_severity ON routing_decisions(severity_level);
CREATE INDEX idx_routing_facility ON routing_decisions(recommended_facility);
```

#### worker_notifications table
```sql
CREATE TABLE worker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) NOT NULL,
    worker_type VARCHAR(20) NOT NULL CHECK (worker_type IN ('asha', 'phc_staff', 'chc_staff')),
    patient_id UUID REFERENCES users(id) NOT NULL,
    routing_decision_id UUID REFERENCES routing_decisions(id),
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('new_referral', 'urgent_case', 'follow_up')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    patient_summary JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'responded', 'completed')),
    acknowledged_at TIMESTAMP,
    response_text TEXT,
    sent_via JSONB DEFAULT '["app"]', -- ['app', 'sms', 'call']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worker_notif_worker_id ON worker_notifications(worker_id);
CREATE INDEX idx_worker_notif_status ON worker_notifications(status);
CREATE INDEX idx_worker_notif_priority ON worker_notifications(priority);
CREATE INDEX idx_worker_notif_created ON worker_notifications(created_at DESC);
```

## Error Handling

### Error Categories and Responses

#### 1. Voice Input Errors
```javascript
{
  MICROPHONE_ACCESS_DENIED: {
    code: 'VOICE_001',
    message: 'माइक्रोफोन की अनुमति नहीं मिली',
    fallback: 'Switch to text input',
    userAction: 'Enable microphone in browser settings'
  },
  SPEECH_RECOGNITION_FAILED: {
    code: 'VOICE_002',
    message: 'आवाज़ समझने में समस्या',
    fallback: 'Retry or use text input',
    userAction: 'Speak clearly and try again'
  },
  BROWSER_NOT_SUPPORTED: {
    code: 'VOICE_003',
    message: 'यह ब्राउज़र वॉइस सपोर्ट नहीं करता',
    fallback: 'Use text input only',
    userAction: 'Use Chrome, Edge, or Safari'
  }
}
```

#### 2. OpenAI API Errors
```javascript
{
  API_TIMEOUT: {
    code: 'AI_001',
    message: 'AI सेवा में देरी हो रही है',
    retry: true,
    maxRetries: 3,
    backoff: 'exponential'
  },
  API_RATE_LIMIT: {
    code: 'AI_002',
    message: 'बहुत सारे अनुरोध, कृपया प्रतीक्षा करें',
    retry: true,
    retryAfter: 60
  },
  API_ERROR: {
    code: 'AI_003',
    message: 'AI सेवा उपलब्ध नहीं है',
    retry: true,
    fallback: 'Use basic symptom checker'
  }
}
```

#### 3. Backend Errors
```javascript
{
  DATABASE_ERROR: {
    code: 'DB_001',
    message: 'डेटा सहेजने में समस्या',
    retry: true,
    queueForLater: true
  },
  AUTHENTICATION_ERROR: {
    code: 'AUTH_001',
    message: 'कृपया फिर से लॉगिन करें',
    action: 'redirect_to_login'
  },
  NETWORK_ERROR: {
    code: 'NET_001',
    message: 'इंटरनेट कनेक्शन की जांच करें',
    retry: true,
    offlineMode: true
  }
}
```

### Error Handling Strategy

```javascript
class ErrorHandler {
  async handleError(error, context) {
    // Log error
    await this.logError(error, context);
    
    // Determine if retryable
    if (this.isRetryable(error)) {
      return await this.retryWithBackoff(context);
    }
    
    // Check for fallback
    if (this.hasFallback(error)) {
      return await this.executeFallback(error, context);
    }
    
    // Return user-friendly error
    return this.formatUserError(error);
  }
  
  async retryWithBackoff(context, attempt = 1) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await this.sleep(delay);
    return await context.retry();
  }
}
```

## Testing Strategy

### 1. Unit Tests

#### Frontend Unit Tests
```javascript
// VoiceInput.test.tsx
describe('VoiceInput Component', () => {
  test('should request microphone permission on mount')
  test('should start listening when button clicked')
  test('should transcribe speech correctly')
  test('should handle speech recognition errors')
  test('should fall back to text input on error')
})

// ConversationDisplay.test.tsx
describe('ConversationDisplay Component', () => {
  test('should render messages correctly')
  test('should display routing information')
  test('should auto-scroll to latest message')
  test('should handle empty conversation state')
})
```

#### Backend Unit Tests
```javascript
// openaiService.test.js
describe('OpenAI Service', () => {
  test('should analyze symptoms correctly')
  test('should assess severity accurately')
  test('should handle API errors gracefully')
  test('should retry on timeout')
})

// routingEngine.test.js
describe('Routing Engine', () => {
  test('should route low severity to ASHA')
  test('should route medium severity to PHC')
  test('should route high severity to CHC')
  test('should route critical cases to emergency')
  test('should find nearest facility')
})

// notificationService.test.js
describe('Notification Service', () => {
  test('should send notification to correct worker')
  test('should include patient summary')
  test('should log notification delivery')
  test('should retry on failure')
})
```

### 2. Integration Tests

```javascript
// voiceAssistant.integration.test.js
describe('Voice Assistant Integration', () => {
  test('should complete full conversation flow')
  test('should save conversation to database')
  test('should trigger routing decision')
  test('should notify healthcare worker')
  test('should retrieve conversation history')
})

// routing.integration.test.js
describe('Routing Integration', () => {
  test('should analyze symptoms and route correctly')
  test('should find nearest available facility')
  test('should create notification for worker')
  test('should update patient record')
})
```

### 3. End-to-End Tests

```javascript
// e2e/voiceAssistant.e2e.test.js
describe('Voice Assistant E2E', () => {
  test('user can start voice conversation')
  test('user receives AI response with routing')
  test('healthcare worker receives notification')
  test('conversation is saved and retrievable')
  test('user can view conversation history')
})
```

### 4. Performance Tests

```javascript
// performance/voiceAssistant.perf.test.js
describe('Voice Assistant Performance', () => {
  test('response time under 3 seconds for 95% of requests')
  test('handles 100 concurrent users')
  test('OpenAI API calls complete within 5 seconds')
  test('database queries complete within 500ms')
})
```

## Security Considerations

### 1. Authentication & Authorization
- All API endpoints require JWT authentication
- User can only access their own conversations
- Healthcare workers can only see notifications assigned to them
- Role-based access control for different user types

### 2. Data Privacy
- Patient health information encrypted at rest
- Conversations stored with user consent
- HIPAA-compliant data handling (where applicable)
- PII masking in logs

### 3. API Security
- OpenAI API key stored in environment variables
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention using parameterized queries

### 4. Voice Data Security
- Voice data not stored permanently
- Only transcribed text is saved
- Secure transmission using HTTPS
- User consent required for voice recording

## Performance Optimization

### 1. Frontend Optimization
- Lazy loading of voice assistant component
- Debouncing of voice input processing
- Virtual scrolling for long conversations
- Caching of conversation history

### 2. Backend Optimization
- Connection pooling for database
- Caching of facility information
- Async processing of notifications
- Streaming responses from OpenAI

### 3. Database Optimization
- Indexed queries on frequently accessed columns
- Pagination for conversation history
- Archiving old conversations
- Query optimization for routing decisions

## Deployment Considerations

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthbridge
DB_USER=postgres
DB_PASSWORD=...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Notification Services
SMS_API_KEY=...
SMS_SENDER_ID=...

# Feature Flags
VOICE_ASSISTANT_ENABLED=true
WORKER_NOTIFICATIONS_ENABLED=true
```

### Monitoring & Logging
- Log all OpenAI API calls with response times
- Monitor routing decision accuracy
- Track notification delivery success rates
- Alert on error rate thresholds
- Dashboard for conversation metrics

## Future Enhancements

1. **Offline Support**: Cache conversations for offline access
2. **Voice Biometrics**: User identification via voice
3. **Multi-modal Input**: Support for image-based symptom analysis
4. **Predictive Routing**: ML model for routing optimization
5. **Real-time Translation**: Live translation for multi-language support
6. **Integration with Wearables**: Import vital signs from devices
7. **Telemedicine Integration**: Direct video consultation booking
8. **Prescription Generation**: AI-assisted prescription creation for doctors
