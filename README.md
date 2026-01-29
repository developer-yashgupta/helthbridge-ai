# 🏥 HealthBridge AI - Complete Healthcare Platform

A comprehensive AI-powered healthcare platform built with Next.js, Node.js, and Python, designed for rural healthcare management in India.

## 🚀 Quick Start

### 1. **One-Click Setup**
```bash
# Install all dependencies
.\install-dependencies.ps1

# Verify setup
node verify-setup.js

# Start all services
.\start-all.ps1
```

### 2. **Access the Application**
- **Frontend**: http://localhost:3001
- **Test Page**: http://localhost:3001/test
- **Backend API**: http://localhost:3000
- **AI Engine**: http://localhost:5000

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Engine     │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React 19      │    │   MongoDB       │    │   ML Models     │
│   Tailwind CSS  │    │   JWT Auth      │    │   Offline AI    │
│   TypeScript    │    │   SMS/OTP       │    │   Multilingual  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Features

### 👥 **Multi-Role Dashboard**
- **Citizens**: AI symptom analysis, health tracking
- **ASHA Workers**: Patient management, village health monitoring
- **Clinical Staff**: OPD management, referral systems
- **Administrators**: Analytics, system monitoring

### 🤖 **AI-Powered Healthcare**
- **Symptom Analysis**: Advanced ML-based disease prediction
- **Risk Assessment**: Green/Amber/Red risk classification
- **Healthcare Routing**: Automatic facility recommendations
- **Medication Suggestions**: Safe medicine recommendations
- **Emergency Detection**: Critical condition alerts

### 🌐 **Multilingual Support**
- **Hindi & English**: Full UI and AI support
- **Voice Input**: Speech-to-text in local languages
- **Image Analysis**: Medical image processing
- **Text Translation**: Real-time language conversion

### 📱 **Modern Tech Stack**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, JWT Authentication
- **AI Engine**: Python, Flask, scikit-learn, TensorFlow
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons

## 📋 System Requirements

- **Node.js**: 18.0+ 
- **Python**: 3.8+
- **npm**: 8.0+
- **pip**: 21.0+
- **RAM**: 8GB+ recommended
- **Storage**: 2GB+ free space

## 🛠️ Installation

### **Automated Installation (Recommended)**
```bash
# Windows PowerShell
.\install-dependencies.ps1

# Windows Command Prompt  
install-dependencies.bat
```

### **Manual Installation**
```bash
# 1. Backend Dependencies
cd backend
npm install

# 2. AI Engine Dependencies
cd ../ai-engine
pip install -r requirements.txt

# 3. Frontend Dependencies
cd ../frontend
npm install
```

## 🚀 Running the Application

### **Automated Startup**
```bash
# Windows PowerShell
.\start-all.ps1

# Windows Command Prompt
start-all.bat
```

### **Manual Startup**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - AI Engine  
cd ai-engine && python app.py

# Terminal 3 - Frontend
cd frontend && npm run dev
```

## 🧪 Testing & Verification

### **Quick Verification**
```bash
# Run comprehensive setup check
node verify-setup.js

# Visit test page
# http://localhost:3001/test
```

### **Manual Testing**
1. **Health Checks**:
   - Backend: http://localhost:3000/health
   - AI Engine: http://localhost:5000/health
   - Frontend: http://localhost:3001

<<<<<<< HEAD
2. **User Flows**:
   - Landing page → Role selection → Login → Dashboard
   - Symptom analysis → AI recommendations → Healthcare routing
=======
### AI/ML
- **Python + Flask** - AI service layer
- **TensorFlow** - Machine learning models
- **IndicBERT** - Multilingual NLP
- **scikit-learn** - Classical ML algorithms
>>>>>>> 625c1d08b102cca30de9e870a07dc91a032ff838

3. **API Integration**:
   - OTP authentication
   - Symptom analysis
   - Healthcare facility lookup

## 📁 Project Structure

```
healthbridge-ai/
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React Components
│   │   ├── lib/            # Utilities & API
│   │   └── hooks/          # Custom Hooks
│   ├── public/             # Static Assets
│   └── package.json
├── backend/                 # Node.js Backend
│   ├── routes/             # API Routes
│   ├── models/             # Database Models
│   ├── middleware/         # Express Middleware
│   └── services/           # Business Logic
├── ai-engine/              # Python AI Engine
│   ├── app.py             # Main Flask App
│   ├── models/            # ML Models
│   └── requirements.txt   # Python Dependencies
└── docs/                  # Documentation
```

## 🔧 Configuration

### **Environment Variables**

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:5000
NODE_ENV=development
```

**Backend** (`backend/.env`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/healthbridge
JWT_SECRET=your_jwt_secret_here
SMS_API_KEY=your_sms_api_key
```

**AI Engine** (`ai-engine/.env`):
```env
FLASK_PORT=5000
MODEL_PATH=./models/
OFFLINE_MODE=true
```

## 🐛 Troubleshooting

### **Common Issues**

1. **TypeScript Errors**:
   ```bash
   cd frontend
   rm -rf node_modules .next
   npm install
   ```

2. **Port Conflicts**:
   - Change ports in respective config files
   - Kill processes using required ports

3. **Module Not Found**:
   ```bash
   # Reinstall dependencies
   .\install-dependencies.ps1
   ```

4. **Build Failures**:
   ```bash
   # Fix TypeScript issues
   .\fix-typescript.bat
   ```

### **Getting Help**
- Check `TROUBLESHOOTING.md` for detailed solutions
- Run `node verify-setup.js` for system diagnostics
- Visit http://localhost:3001/test for integration testing

## 🚀 Deployment

### **Development**
```bash
# All services locally
.\start-all.ps1
```

### **Production**
- **Frontend**: Vercel, Netlify, or Docker
- **Backend**: AWS EC2, Heroku, or Docker
- **AI Engine**: AWS Lambda, Google Cloud Run, or Docker
- **Database**: MongoDB Atlas, AWS DocumentDB

## 📊 Performance

- **Frontend**: Next.js optimizations, code splitting, image optimization
- **Backend**: Express.js with clustering, Redis caching
- **AI Engine**: Model optimization, batch processing, caching
- **Database**: MongoDB indexing, connection pooling

## 🔐 Security

- **Authentication**: JWT tokens, OTP verification
- **Authorization**: Role-based access control
- **Data Protection**: Input validation, XSS prevention
- **API Security**: Rate limiting, CORS configuration
- **Encryption**: HTTPS, data encryption at rest

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<<<<<<< HEAD
=======
## 🆘 Support

### Community Support
- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time community chat
- **Documentation** - Comprehensive guides and tutorials

### Professional Support
- **Email**: 
- **Phone**: 
- **Website**: https://healthbridge.ai

### Security Issues
Report security vulnerabilities to: security@healthbridge.ai

>>>>>>> 625c1d08b102cca30de9e870a07dc91a032ff838
## 🙏 Acknowledgments

- **Healthcare Workers**: For their invaluable feedback and requirements
- **Open Source Community**: For the amazing tools and libraries
- **Government of India**: For healthcare digitization initiatives
- **Rural Communities**: For inspiring this solution

---

## 🎉 Ready to Start!

Your HealthBridge AI platform is now ready for development and deployment. The complete integration between Next.js frontend, Node.js backend, and Python AI engine is working seamlessly.

**Next Steps:**
1. Run `.\start-all.ps1` to start all services
2. Visit http://localhost:3001 to access the application
3. Test the AI features and user flows
4. Customize for your specific healthcare requirements

<<<<<<< HEAD
**Happy Coding!** 🚀
=======
[Website](https://healthbridge.ai) • [Demo](DEMO.md) • [Docs](docs/) • [Community](https://discord.gg/healthbridge)

</div>
>>>>>>> 625c1d08b102cca30de9e870a07dc91a032ff838
