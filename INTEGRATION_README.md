# HealthBridge AI - Full Stack Integration

This document explains how the frontend, backend, and AI engine are integrated to work together.

## Architecture Overview

```
Frontend (Next.js) ←→ Backend (Node.js) ←→ AI Engine (Python)
     ↓                    ↓                     ↓
  Port 3001            Port 3000            Port 5000
```

## Services Integration

### 1. Frontend (Next.js)
- **Location**: `frontend/`
- **Port**: 3001
- **API Integration**: `frontend/src/lib/api-service.ts`
- **Authentication**: OTP-based login with JWT tokens
- **Features**:
  - Citizen dashboard with AI symptom analysis
  - ASHA worker dashboard with patient management
  - Real-time API calls to backend and AI engine

### 2. Backend (Node.js)
- **Location**: `backend/`
- **Port**: 3000
- **Database**: MongoDB
- **Features**:
  - User authentication (OTP via SMS)
  - User management and profiles
  - Healthcare facility data
  - Triage and resource management

### 3. AI Engine (Python)
- **Location**: `ai-engine/`
- **Port**: 5000
- **ML Models**: Offline-capable disease prediction
- **Features**:
  - Symptom analysis with risk assessment
  - Healthcare routing recommendations
  - Multilingual support (Hindi/English)
  - Voice and image analysis

## API Integration Points

### Authentication Flow
1. Frontend sends OTP request → Backend
2. Backend generates OTP → SMS service
3. User enters OTP → Frontend validates with Backend
4. Backend returns JWT token → Frontend stores token

### Symptom Analysis Flow
1. User enters symptoms → Frontend
2. Frontend sends analysis request → AI Engine
3. AI Engine processes symptoms → Returns risk assessment
4. Frontend displays results with healthcare routing

### Data Flow
```
User Input → Frontend → API Service → Backend/AI Engine → Database/ML Models → Response → Frontend → User
```

## Environment Configuration

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/healthbridge
JWT_SECRET=your_jwt_secret
SMS_API_KEY=your_sms_api_key
```

### AI Engine (.env)
```
FLASK_PORT=5000
MODEL_PATH=./models/
OFFLINE_MODE=true
```

## Starting the Application

### Option 1: Automated Start (Windows)
```bash
# Command Prompt
start-all.bat

# PowerShell
.\start-all.ps1
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - AI Engine
cd ai-engine
python enhanced_app.py

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## API Endpoints

### Backend Endpoints
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile
- `GET /api/triage/stats` - Get triage statistics
- `POST /api/resources/find` - Find healthcare resources

### AI Engine Endpoints
- `POST /analyze` - Analyze symptoms
- `GET /user-history/:userId` - Get user history
- `GET /healthcare-facilities` - Get facilities
- `POST /voice-to-text` - Convert voice to text
- `POST /image-analysis` - Analyze medical images
- `POST /translate` - Translate text
- `POST /emergency-alert` - Send emergency alert

## Key Integration Features

### 1. Unified Authentication
- Single sign-on across all services
- JWT token-based authentication
- Role-based access control

### 2. Real-time Symptom Analysis
- Frontend collects symptoms
- AI engine provides instant analysis
- Backend stores consultation history

### 3. Healthcare Routing
- AI determines appropriate care level
- Backend provides facility information
- Frontend displays routing recommendations

### 4. Multilingual Support
- AI engine handles Hindi/English
- Frontend adapts UI language
- Backend stores language preferences

### 5. Offline Capability
- AI models work offline
- Frontend caches critical data
- Graceful degradation when services unavailable

## Data Models

### User Model (Backend)
```javascript
{
  phone: String,
  name: String,
  userType: String,
  language: String,
  location: Object,
  createdAt: Date
}
```

### Symptom Analysis Request (AI Engine)
```python
{
  userId: str,
  symptoms: List[str] | str,
  inputType: str,
  language: str,
  patientAge: int,
  patientGender: str,
  location: dict
}
```

### Analysis Response (AI Engine)
```python
{
  success: bool,
  riskLevel: str,
  riskScore: int,
  diseasePredictions: List[dict],
  healthcareRouting: dict,
  recommendations: List[str]
}
```

## Security Considerations

1. **API Security**: All endpoints use JWT authentication
2. **Data Encryption**: Sensitive data encrypted in transit
3. **Input Validation**: All user inputs validated and sanitized
4. **Rate Limiting**: API calls rate-limited to prevent abuse
5. **CORS**: Proper CORS configuration for cross-origin requests

## Monitoring and Logging

- Backend logs all API requests
- AI engine logs model predictions
- Frontend logs user interactions
- Error tracking and performance monitoring

## Deployment Notes

1. **Development**: Use provided start scripts
2. **Production**: 
   - Use PM2 for Node.js backend
   - Use Gunicorn for Python AI engine
   - Use Vercel/Netlify for Next.js frontend
3. **Database**: MongoDB Atlas for production
4. **Models**: Store ML models in cloud storage

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000, 3001, 5000 are available
2. **CORS errors**: Check API URLs in environment variables
3. **Authentication failures**: Verify JWT secret configuration
4. **Model loading errors**: Ensure Python dependencies installed

### Debug Mode
Set `NODE_ENV=development` and `FLASK_DEBUG=true` for detailed logging.

## Next Steps

1. Add real SMS integration for OTP
2. Implement push notifications
3. Add real-time chat with ASHA workers
4. Integrate with government health databases
5. Add telemedicine video calling
6. Implement offline-first architecture