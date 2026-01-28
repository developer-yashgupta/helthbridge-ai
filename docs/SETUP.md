# HealthBridge AI - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- PostgreSQL 13+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-org/healthbridge-ai.git
cd healthbridge-ai
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install-all

# Or install individually
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd ../frontend && npm install  # Frontend dependencies
cd ../ai-engine && pip install -r requirements.txt  # AI engine dependencies
```

### 3. Environment Setup

#### Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthbridge
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key

# AI Engine
AI_ENGINE_URL=http://localhost:5000

# Optional: External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
SMS_API_KEY=your_sms_api_key
```

#### AI Engine Environment
```bash
cd ai-engine
cp .env.example .env
# Configure AI engine settings
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb healthbridge

# Run migrations
cd database
psql -d healthbridge -f schema.sql
```

### 5. Start Development Servers
```bash
# Start all services (from root directory)
npm run dev

# Or start individually
npm run backend     # Backend API (port 3000)
npm run frontend    # React Native (port 8081)
npm run ai-engine   # AI Engine (port 5000)
```

## 📱 Mobile App Setup

### React Native Development

#### Android Setup
1. Install Android Studio
2. Set up Android SDK (API level 30+)
3. Create virtual device or connect physical device
4. Enable USB debugging

```bash
cd frontend
npx react-native run-android
```

#### iOS Setup (macOS only)
1. Install Xcode 12+
2. Install CocoaPods: `sudo gem install cocoapods`
3. Install iOS dependencies:

```bash
cd frontend/ios
pod install
cd ..
npx react-native run-ios
```

### Web Development (PWA)
```bash
cd frontend
npm run web
```

## 🤖 AI Engine Setup

### Python Environment
```bash
cd ai-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download required models (optional)
python download_models.py
```

### Model Configuration
The AI engine supports both online and offline modes:

- **Online Mode**: Uses cloud-based models for better accuracy
- **Offline Mode**: Uses lightweight local models for rural areas

## 🗄️ Database Configuration

### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib  # Ubuntu
brew install postgresql                             # macOS

# Start PostgreSQL service
sudo systemctl start postgresql  # Ubuntu
brew services start postgresql   # macOS

# Create user and database
sudo -u postgres psql
CREATE USER healthbridge WITH PASSWORD 'your_password';
CREATE DATABASE healthbridge OWNER healthbridge;
GRANT ALL PRIVILEGES ON DATABASE healthbridge TO healthbridge;
\q
```

### SQLite (Development)
For development, you can use SQLite instead of PostgreSQL:

```bash
# Install SQLite
sudo apt-get install sqlite3  # Ubuntu
brew install sqlite3          # macOS

# Create database
sqlite3 healthbridge.db < database/schema_sqlite.sql
```

## 🔧 Configuration Options

### Backend Configuration
Edit `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_TYPE=postgresql  # or 'sqlite' for development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthbridge
DB_USER=healthbridge
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AI Engine
AI_ENGINE_URL=http://localhost:5000
AI_FALLBACK_ENABLED=true

# External Services
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SMS_API_KEY=your_sms_gateway_api_key
SMS_SENDER_ID=HLTHBRDG

# File Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### AI Engine Configuration
Edit `ai-engine/.env`:

```env
# Server
PORT=5000
DEBUG=true

# Models
MODEL_PATH=./models
OFFLINE_MODE=true
MODEL_CACHE_SIZE=100MB

# Languages
DEFAULT_LANGUAGE=hi
SUPPORTED_LANGUAGES=hi,en,ta,te,bn,gu,mr

# Performance
MAX_WORKERS=4
TIMEOUT_SECONDS=30
```

### Frontend Configuration
Edit `frontend/src/config/config.js`:

```javascript
export const config = {
  API_BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api',
  
  AI_ENGINE_URL: __DEV__
    ? 'http://localhost:5000'
    : 'https://your-ai-engine.com',
  
  DEFAULT_LANGUAGE: 'hi',
  SUPPORTED_LANGUAGES: ['hi', 'en', 'ta', 'te', 'bn', 'gu', 'mr'],
  
  OFFLINE_ENABLED: true,
  SYNC_INTERVAL: 300000, // 5 minutes
  
  MAPS_API_KEY: 'your_google_maps_api_key',
  
  FEATURES: {
    VOICE_INPUT: true,
    IMAGE_ANALYSIS: true,
    OFFLINE_MODE: true,
    TELECONSULTATION: true,
  }
};
```

## 🧪 Testing Setup

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Test coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                   # Run Jest tests
npm run test:e2e          # End-to-end tests with Detox
```

### AI Engine Testing
```bash
cd ai-engine
python -m pytest tests/           # Run all tests
python -m pytest tests/test_api.py  # Specific test file
```

## 🚀 Production Deployment

### Docker Setup
```bash
# Build all services
docker-compose build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

#### Backend Deployment
```bash
cd backend
npm run build
npm start
```

#### AI Engine Deployment
```bash
cd ai-engine
pip install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Frontend Deployment
```bash
cd frontend
npm run build:android  # Android APK
npm run build:ios      # iOS IPA
npm run build:web      # Web PWA
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
dropdb healthbridge
createdb healthbridge
psql -d healthbridge -f database/schema.sql
```

#### React Native Metro Issues
```bash
cd frontend
npx react-native start --reset-cache
```

#### AI Engine Model Loading Error
```bash
cd ai-engine
python download_models.py  # Re-download models
```

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different ports in .env files
```

### Performance Optimization

#### Backend Optimization
- Enable Redis caching
- Use connection pooling for database
- Implement API rate limiting
- Enable gzip compression

#### Frontend Optimization
- Enable Hermes engine for React Native
- Implement lazy loading for screens
- Optimize images and assets
- Use offline-first data strategy

#### AI Engine Optimization
- Use GPU acceleration if available
- Implement model caching
- Use quantized models for mobile
- Enable batch processing

## 📚 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/symptom-checker

# Make changes and commit
git add .
git commit -m "feat: add voice input for symptom checker"

# Push and create PR
git push origin feature/symptom-checker
```

### Code Quality
```bash
# Run linting
npm run lint        # Backend
cd frontend && npm run lint  # Frontend
cd ai-engine && flake8 .     # AI Engine

# Format code
npm run format      # Backend & Frontend
cd ai-engine && black .      # AI Engine
```

### Database Migrations
```bash
# Create new migration
cd database/migrations
touch 002_add_teleconsult_table.sql

# Apply migration
psql -d healthbridge -f 002_add_teleconsult_table.sql
```

## 🆘 Getting Help

- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Create GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Community**: Join our Slack/Discord for real-time help

## 📋 Checklist

Before submitting your setup:

- [ ] All services start without errors
- [ ] Database schema is applied correctly
- [ ] Frontend connects to backend API
- [ ] AI engine responds to health check
- [ ] Tests pass for all components
- [ ] Environment variables are configured
- [ ] Documentation is updated if needed

---

You're now ready to develop HealthBridge AI! 🎉