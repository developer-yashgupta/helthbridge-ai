# Implementation Plan

- [x] 1. Database schema setup and migrations





  - Create database migration file for new tables (conversations, conversation_messages, routing_decisions, worker_notifications)
  - Add indexes for performance optimization
  - Write seed data for testing
  - _Requirements: 4.1, 4.2, 8.1, 9.1_

- [x] 2. Backend: OpenAI Service implementation





  - [x] 2.1 Create OpenAI service module with API client setup


    - Initialize OpenAI client with API key configuration
    - Implement error handling and retry logic with exponential backoff
    - Create healthcare-specific system prompt template
    - Write unit tests for service initialization and configuration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.2_
  

  - [x] 2.2 Implement symptom analysis function

    - Create function to analyze user symptoms using OpenAI API
    - Extract symptom keywords and severity indicators from user message
    - Include conversation history context in API calls
    - Implement streaming response support for real-time feedback
    - Write unit tests for symptom analysis with various inputs
    - _Requirements: 2.1, 2.3, 2.8_
  
  - [x] 2.3 Implement severity assessment function


    - Create severity scoring algorithm (0-100 scale)
    - Integrate patient age, gender, and medical history into assessment
    - Map severity scores to levels (low, medium, high, critical)
    - Add emergency keyword detection (chest pain, difficulty breathing, etc.)
    - Write unit tests for severity assessment with edge cases
    - _Requirements: 2.3, 8.2, 8.4_

- [x] 3. Backend: Routing Engine Service implementation
  - [x] 3.1 Create routing decision logic
    - Implement routing algorithm based on severity levels
    - Map severity to facility types (ASHA: 0-40, PHC: 41-60, CHC: 61-80, Emergency: 81-100)
    - Create reasoning text generation for routing decisions
    - Write unit tests for routing logic with various severity scores
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 3.2 Implement facility finder function
    - Create function to find nearest facility by type and location
    - Query healthcare_resources table with geospatial filtering
    - Check facility availability status
    - Implement fallback logic when no facilities available
    - Write unit tests for facility finding with mock data
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [x] 3.3 Implement priority calculation
    - Create priority scoring based on symptoms, age, and medical history
    - Add risk factor adjustments (diabetes, hypertension, etc.)
    - Implement timeframe recommendations (immediate, 4 hours, 24 hours, 48 hours)
    - Write unit tests for priority calculation
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Backend: Notification Service implementation
  - [x] 4.1 Create worker notification function
    - Implement function to create notification records in database
    - Format patient summary with symptoms, severity, and contact info
    - Determine notification priority based on severity
    - Write unit tests for notification creation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 4.2 Implement notification delivery
    - Create in-app notification delivery mechanism
    - Implement SMS notification integration (using existing SMS service)
    - Add notification logging for audit trail
    - Implement retry logic for failed deliveries
    - Write unit tests for notification delivery
    - _Requirements: 9.5, 9.6_
  
  - [x] 4.3 Implement worker selection logic
    - Create function to find available workers by type and location
    - Implement load balancing based on current caseload
    - Add on-duty status checking
    - Write unit tests for worker selection
    - _Requirements: 9.8_

- [x] 5. Backend: Conversation Service implementation
  - [x] 5.1 Create conversation management functions
    - Implement createConversation function with user metadata
    - Implement addMessage function to save messages
    - Add conversation title auto-generation from first message
    - Write unit tests for conversation creation and message addition
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 5.2 Implement conversation retrieval functions
    - Create getConversationHistory function with pagination
    - Implement getConversation function to fetch specific conversation with messages
    - Add filtering by date range and status
    - Write unit tests for conversation retrieval
    - _Requirements: 4.3, 4.4, 4.6_
  
  - [x] 5.3 Implement conversation metadata updates
    - Create function to update conversation metadata (language, status)
    - Add last_message_at timestamp updates
    - Implement message count tracking
    - Write unit tests for metadata updates
    - _Requirements: 4.7_

- [x] 6. Backend: Voice Assistant API routes
  - [x] 6.1 Create POST /api/voice-assistant/analyze endpoint
    - Implement request validation for required fields
    - Integrate OpenAI service for symptom analysis
    - Integrate routing engine for facility recommendation
    - Save conversation and messages to database
    - Create routing decision record
    - Trigger worker notification
    - Return response with routing information
    - Write integration tests for analyze endpoint
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 8.1, 9.1_
  
  - [x] 6.2 Create GET /api/voice-assistant/conversations/:userId endpoint
    - Implement authentication check for user access
    - Retrieve conversation list with pagination
    - Include message count and last message preview
    - Write integration tests for conversation list endpoint
    - _Requirements: 4.3, 4.4, 5.1_
  
  - [x] 6.3 Create GET /api/voice-assistant/conversation/:conversationId endpoint
    - Implement authentication and authorization check
    - Retrieve conversation with all messages
    - Include routing decisions for each message
    - Write integration tests for conversation detail endpoint
    - _Requirements: 4.3, 4.4_
  
  - [x] 6.4 Create POST /api/voice-assistant/feedback endpoint
    - Implement feedback submission for AI responses
    - Save feedback to database for quality improvement
    - Write integration tests for feedback endpoint
    - _Requirements: 4.2_

- [x] 7. Backend: Worker Notification API routes
  - [x] 7.1 Create GET /api/worker-notifications/:workerId endpoint
    - Implement authentication check for worker access
    - Retrieve notifications with filtering (pending, acknowledged, all)
    - Include patient summary and routing information
    - Add pagination support
    - Write integration tests for notification list endpoint
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 7.2 Create PUT /api/worker-notifications/:notificationId/acknowledge endpoint
    - Implement notification acknowledgment
    - Update status and acknowledged_at timestamp
    - Allow worker to add response text
    - Write integration tests for acknowledgment endpoint
    - _Requirements: 9.7_
  
  - [x] 7.3 Create GET /api/worker-notifications/stats/:workerId endpoint
    - Calculate notification statistics (pending, acknowledged, response time)
    - Return worker performance metrics
    - Write integration tests for stats endpoint
    - _Requirements: 9.7_

- [x] 8. Frontend: Voice Input Component
  - [x] 8.1 Create VoiceInput component with Web Speech API
    - Initialize SpeechRecognition API with browser compatibility check
    - Implement microphone permission request
    - Add visual indicator for recording state
    - Implement start/stop recording functions
    - Add error handling for unsupported browsers
    - Write unit tests for VoiceInput component
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 8.2 Implement speech-to-text conversion
    - Configure speech recognition with language support
    - Handle real-time transcription updates
    - Implement final transcript extraction
    - Add confidence score checking
    - Handle speech recognition errors with fallback
    - Write unit tests for transcription handling
    - _Requirements: 1.5, 1.6, 10.1_

- [x] 9. Frontend: Voice Output Component
  - [x] 9.1 Create VoiceOutput component with Text-to-Speech
    - Initialize SpeechSynthesis API
    - Implement text-to-speech conversion function
    - Add playback controls (play, pause, stop, replay)
    - Implement voice selection based on language
    - Add browser compatibility check
    - Write unit tests for VoiceOutput component
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.3_
  
  - [x] 9.2 Implement voice output preferences
    - Add toggle for auto-play voice responses
    - Save voice preference in session storage
    - Implement voice rate and pitch controls
    - Write unit tests for preference handling
    - _Requirements: 3.5, 3.6_

- [x] 10. Frontend: Conversation Display Component
  - [x] 10.1 Create ConversationDisplay component
    - Implement message list rendering with role-based styling
    - Add timestamp display for each message
    - Implement auto-scroll to latest message
    - Add scroll position preservation when user scrolls up
    - Write unit tests for ConversationDisplay component
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 10.2 Implement routing information display
    - Create RoutingCard component to show facility recommendations
    - Display severity level with color coding
    - Show facility contact information and location
    - Add reasoning text for routing decision
    - Implement "Get Directions" button with map integration
    - Write unit tests for routing display
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 10.3 Add medical disclaimer and safety warnings
    - Display disclaimer on first message
    - Highlight emergency warnings for critical cases
    - Show emergency contact numbers prominently
    - Add medication consultation reminders
    - Write unit tests for disclaimer display
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Frontend: Main Voice Healthcare Assistant Component
  - [x] 11.1 Create VoiceHealthcareAssistant container component
    - Implement component state management (listening, processing, speaking)
    - Integrate VoiceInput, ConversationDisplay, and VoiceOutput components
    - Add loading states and error handling
    - Implement conversation initialization
    - Write unit tests for container component
    - _Requirements: 1.1, 3.1, 6.1, 6.2_
  
  - [x] 11.2 Implement API integration for message analysis
    - Create API client function to call /api/voice-assistant/analyze
    - Handle request/response with loading states
    - Implement error handling with user-friendly messages
    - Add retry logic for failed requests
    - Write integration tests for API calls
    - _Requirements: 2.1, 2.2, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 11.3 Implement conversation history loading
    - Create function to load conversation history on mount
    - Add pagination for loading more messages
    - Implement conversation switching
    - Write integration tests for history loading
    - _Requirements: 4.3, 4.4, 4.6_
  
  - [x] 11.4 Add language selection and multi-language support
    - Implement language selector dropdown
    - Configure voice recognition language
    - Configure TTS voice language
    - Update API calls with selected language
    - Write unit tests for language switching
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Frontend: User Interface and Styling
  - [ ] 12.1 Create responsive layout for voice assistant
    - Design mobile-first layout with Tailwind CSS
    - Implement desktop layout with sidebar for history
    - Add animations for message appearance
    - Create loading skeletons for better UX
    - Write visual regression tests
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 12.2 Implement accessibility features
    - Add ARIA labels for screen readers
    - Implement keyboard navigation
    - Add focus management for modal dialogs
    - Ensure color contrast meets WCAG standards
    - Write accessibility tests
    - _Requirements: 1.1, 3.1, 6.1_

- [ ] 13. Integration and Error Handling
  - [ ] 13.1 Implement comprehensive error handling
    - Create error boundary component for React errors
    - Implement error logging service
    - Add user-friendly error messages in Hindi and English
    - Create fallback UI for critical errors
    - Write tests for error scenarios
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 13.2 Implement offline detection and handling
    - Add network status detection
    - Show offline indicator to user
    - Queue messages for sending when online
    - Implement sync mechanism when connection restored
    - Write tests for offline scenarios
    - _Requirements: 7.5, 7.6_
  
  - [ ] 13.3 Add performance monitoring
    - Implement response time tracking
    - Add error rate monitoring
    - Create performance metrics dashboard
    - Set up alerts for degraded performance
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Testing and Quality Assurance
  - [ ] 14.1 Write end-to-end tests for complete user flows
    - Test voice input to AI response flow
    - Test routing decision and notification flow
    - Test conversation history retrieval
    - Test error handling and recovery
    - _Requirements: All_
  
  - [ ] 14.2 Perform integration testing
    - Test OpenAI service integration
    - Test database operations
    - Test notification delivery
    - Test API endpoint responses
    - _Requirements: All_
  
  - [ ] 14.3 Conduct performance testing
    - Load test with 100 concurrent users
    - Measure API response times
    - Test database query performance
    - Optimize slow operations
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 15. Documentation and Deployment
  - [ ] 15.1 Create API documentation
    - Document all voice assistant endpoints
    - Add request/response examples
    - Create Postman collection for testing
    - Write integration guide for frontend
    - _Requirements: All_
  
  - [ ] 15.2 Write user documentation
    - Create user guide for voice assistant
    - Add troubleshooting section
    - Document supported languages and browsers
    - Create FAQ section
    - _Requirements: All_
  
  - [ ] 15.3 Set up environment configuration
    - Configure OpenAI API key in environment variables
    - Set up database connection strings
    - Configure notification service credentials
    - Create deployment scripts
    - _Requirements: All_
