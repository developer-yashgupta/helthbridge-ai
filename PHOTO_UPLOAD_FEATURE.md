# Photo Upload Feature Documentation

## Overview
Users can now upload photos for AI analysis using Gemini Vision API. This feature allows analysis of:
- Medical conditions (rashes, wounds, injuries)
- Prescriptions and medical reports
- Lab test results
- Symptoms that are visible (skin conditions, swelling, etc.)

## Features Implemented

### 1. Frontend (Citizen Dashboard)

#### Photo Upload Button
- Click "Photo" button to select an image
- Supports all common image formats (JPEG, PNG, etc.)
- Maximum file size: 5MB
- Instant preview before analysis

#### Image Preview
- Shows uploaded image before sending
- Remove button (✕) to cancel upload
- Visual indicator: "📷 Image ready for analysis"

#### Image Analysis
- "🔍 Analyze Image" button appears after upload
- Shows loading state: "Analyzing..."
- Image appears in chat history with user message
- AI response is displayed and spoken automatically

#### Chat Integration
- Images appear inline in chat messages
- Thumbnail preview (max height: 160px)
- Maintains conversation context
- Images are cleared after successful analysis

### 2. Backend API

#### Endpoint: POST /api/voice-assistant/analyze
**New Parameters:**
```javascript
{
  userId: string,           // Required
  message: string,          // Optional if imageData provided
  imageData: string,        // Base64 encoded image (optional)
  conversationId: string,   // Optional
  language: string,         // Default: 'hi'
  patientInfo: object       // Patient context
}
```

**Response:**
```javascript
{
  success: true,
  response: "AI analysis of the image...",
  routing: {
    severity: "low" | "medium" | "high" | "critical",
    severityScore: 0-100,
    facility: {...},
    facilityType: "ASHA" | "PHC" | "CHC" | "EMERGENCY",
    reasoning: "...",
    priority: "...",
    timeframe: "..."
  },
  conversationId: "...",
  messageId: "..."
}
```

### 3. Gemini Vision Integration

#### New Method: analyzeImageWithVision()
```javascript
await geminiService.analyzeImageWithVision(
  imageData,      // Base64 image
  userMessage,    // User's question about image
  conversationHistory,
  userContext
);
```

**Features:**
- Uses Gemini 1.5 Flash with vision capabilities
- Analyzes medical images intelligently
- Provides health guidance based on visual analysis
- Maintains conversation context
- Short, clear responses (3-5 sentences)

**Analysis Capabilities:**
1. **Medical Conditions:** Identifies visible symptoms (rashes, wounds, swelling)
2. **Prescriptions:** Reads and summarizes medication information
3. **Lab Reports:** Extracts key findings from test results
4. **General Health:** Provides guidance based on visual observations

## User Flow

### Uploading and Analyzing a Photo

1. **User clicks "Photo" button**
   - File picker opens
   - User selects image from device

2. **Image validation**
   - Checks file type (must be image)
   - Checks file size (max 5MB)
   - Shows error if validation fails

3. **Preview displayed**
   - Image thumbnail shown
   - "📷 Image ready for analysis" message
   - Remove button available

4. **User clicks "🔍 Analyze Image"**
   - Image converted to base64
   - Added to chat history with user message
   - Sent to backend API

5. **AI Analysis**
   - Gemini Vision analyzes the image
   - Generates health guidance
   - Returns routing recommendation

6. **Results displayed**
   - AI response shown in chat
   - Response spoken automatically (Hindi TTS)
   - Routing card displayed if needed
   - Image cleared from preview

## Technical Implementation

### Frontend Components

**State Management:**
```typescript
const [uploadedImage, setUploadedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Key Functions:**
- `handleImageUpload()` - Validates and previews image
- `removeImage()` - Clears uploaded image
- `analyzeImage()` - Sends image to AI for analysis

### Backend Services

**GeminiService:**
- `analyzeImageWithVision()` - Main image analysis method
- `_buildImageAnalysisPrompt()` - Creates vision-specific prompt

**VoiceAssistant Route:**
- Accepts `imageData` parameter
- Routes to vision API when image present
- Falls back to text analysis for non-image requests

### API Service

**Updated Method:**
```typescript
apiService.analyzeSymptoms({
  symptoms: string,
  imageData?: string,  // New parameter
  inputType: 'text' | 'image',
  ...
})
```

## Security & Validation

### Frontend Validation
- ✅ File type check (images only)
- ✅ File size limit (5MB max)
- ✅ User-friendly error messages in Hindi

### Backend Validation
- ✅ Requires userId
- ✅ Requires either message or imageData
- ✅ Base64 format validation
- ✅ Error handling for invalid images

### Privacy
- ✅ Images sent as base64 (no file storage)
- ✅ Images cleared after analysis
- ✅ No permanent image storage on client
- ✅ Conversation history maintained in database

## Error Handling

### Frontend Errors
```typescript
// File too large
"इमेज का साइज़ 5MB से कम होना चाहिए"

// Invalid file type
"कृपया एक वैध इमेज फ़ाइल चुनें"

// Analysis failed
"I'm sorry, I couldn't analyze the image. Please try again..."
```

### Backend Errors
- Invalid image data → 400 Bad Request
- Gemini API failure → Retry with backoff
- Vision API unavailable → Graceful error message

## Performance Considerations

### Image Optimization
- Client-side preview (no server upload for preview)
- Base64 encoding only when analyzing
- Automatic cleanup after analysis

### API Performance
- Single Gemini Vision call (no multiple requests)
- Fast symptom detection for routing
- Async worker notifications

### Expected Response Times
- Image upload & preview: < 100ms
- AI analysis: 3-5 seconds
- Total user experience: 3-5 seconds

## Usage Examples

### Example 1: Skin Rash
**User:** Uploads photo of red rash on arm
**AI Response:** "I can see a red, patchy rash on your arm. This could be an allergic reaction or dermatitis. Apply a cool compress and avoid scratching. If it worsens or spreads, consult a doctor within 24 hours."

### Example 2: Prescription
**User:** Uploads photo of prescription
**AI Response:** "I can see a prescription for antibiotics (Amoxicillin 500mg, 3 times daily for 7 days). Take with food to avoid stomach upset. Complete the full course even if you feel better. Contact your doctor if you have any side effects."

### Example 3: Lab Report
**User:** Uploads blood test report
**AI Response:** "Your blood sugar level is 145 mg/dL (slightly elevated). Your cholesterol is within normal range. Consider reducing sugar intake and increasing physical activity. Follow up with your doctor to discuss diabetes risk."

## Future Enhancements

### Potential Improvements
1. **Multiple Images:** Allow uploading multiple images at once
2. **Image Compression:** Reduce file size before upload
3. **OCR Enhancement:** Better text extraction from reports
4. **Image History:** Save analyzed images in conversation
5. **Camera Integration:** Direct camera capture (mobile)
6. **Image Annotations:** Allow users to mark areas of concern

### Advanced Features
- Real-time image analysis (streaming)
- Comparison with previous images
- Medical image database matching
- Specialist referral based on image analysis

## Testing Checklist

- [ ] Upload valid image (JPEG, PNG)
- [ ] Upload oversized image (> 5MB) - should show error
- [ ] Upload non-image file - should show error
- [ ] Preview image before analysis
- [ ] Remove image from preview
- [ ] Analyze medical condition image
- [ ] Analyze prescription image
- [ ] Analyze lab report image
- [ ] Verify AI response is spoken
- [ ] Verify image appears in chat history
- [ ] Verify routing decision is correct
- [ ] Test on mobile device
- [ ] Test with poor network connection

## Files Modified

1. **Frontend:**
   - `frontend/src/app/citizen/dashboard/page.tsx` - Photo upload UI
   - `frontend/src/lib/api-service.ts` - Image data support

2. **Backend:**
   - `backend/routes/voiceAssistant.js` - Image endpoint handling
   - `backend/services/geminiService.js` - Vision API integration

3. **Documentation:**
   - `PHOTO_UPLOAD_FEATURE.md` - This file

## API Keys Required

Ensure `GEMINI_API_KEY` is set in `.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Gemini 1.5 Flash supports vision capabilities by default.

---

**Status:** ✅ Fully Implemented and Ready for Testing

**Next Steps:**
1. Test with various image types
2. Gather user feedback
3. Optimize image compression if needed
4. Add more detailed medical image analysis
