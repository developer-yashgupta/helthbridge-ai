# HealthBridge AI - Next.js Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- MongoDB running (optional, fallback available)

### 1. Start All Services

**Option A: Automated (Windows)**
```bash
# PowerShell
.\start-all.ps1

# Command Prompt
start-all.bat
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend (Node.js)
cd backend
npm install
npm start

# Terminal 2 - AI Engine (Python)
cd ai-engine
pip install -r requirements.txt
python app.py

# Terminal 3 - Frontend (Next.js)
cd frontend
npm install
npm run dev
```

### 2. Access the Application
- **Frontend**: http://localhost:3001
- **Test Page**: http://localhost:3001/test
- **Backend API**: http://localhost:3000
- **AI Engine**: http://localhost:5000

## 🔧 Next.js Configuration

### Project Structure
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # Landing page
│   │   ├── test/           # Test page
│   │   ├── citizen/        # Citizen dashboard
│   │   ├── asha/           # ASHA dashboard
│   │   ├── clinical/       # Clinical dashboard
│   │   └── admin/          # Admin dashboard
│   ├── components/         # Reusable components
│   │   ├── ui/            # UI components (shadcn/ui)
│   │   └── *.tsx          # Custom components
│   ├── lib/               # Utilities and services
│   │   ├── api-service.ts # API integration
│   │   ├── types.ts       # Type definitions
│   │   └── utils.ts       # Utility functions
│   ├── hooks/             # Custom React hooks
│   └── types/             # Global type definitions
├── public/                # Static assets
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── package.json           # Dependencies
```

### Key Features Configured

#### ✅ React 19 + Next.js 15
- Latest React features
- App Router for better performance
- Server and Client Components

#### ✅ TypeScript Support
- Strict type checking disabled for development
- Custom type definitions
- Proper Next.js types

#### ✅ Tailwind CSS + shadcn/ui
- Modern UI components
- Responsive design
- Dark/light mode support

#### ✅ API Integration
- Backend connection (Node.js)
- AI Engine connection (Python)
- Error handling and fallbacks

#### ✅ Authentication
- OTP-based login
- JWT token management
- Role-based routing

## 🧪 Testing the Setup

### 1. Visit Test Page
Go to http://localhost:3001/test to verify:
- ✅ Next.js is running
- ✅ Backend connection
- ✅ AI Engine connection
- ✅ API integration works

### 2. Test User Flows
1. **Landing Page**: http://localhost:3001
2. **Login Flow**: Click any role → Enter phone → Get OTP
3. **Dashboard**: Access role-specific dashboards
4. **AI Analysis**: Test symptom analysis feature

### 3. Component Testing
All React components are now Next.js compatible:
- ✅ Client-side rendering with "use client"
- ✅ Proper TypeScript types
- ✅ SSR-safe localStorage usage
- ✅ Next.js routing integration

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

#### 1. TypeScript Errors
```bash
# If you see module resolution errors
rm -rf node_modules package-lock.json
npm install
```

#### 2. Port Conflicts
- Frontend: Change port in package.json `"dev": "next dev -p 3001"`
- Backend: Change PORT in backend/.env
- AI Engine: Change port in ai-engine/app.py

#### 3. API Connection Issues
- Check if all services are running
- Verify environment variables in frontend/.env.local
- Test endpoints manually: http://localhost:3000/health

#### 4. Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Environment Variables

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:5000
NODE_ENV=development
```

## 📱 Mobile Responsiveness

All components are mobile-responsive:
- ✅ Responsive grid layouts
- ✅ Mobile-first design
- ✅ Touch-friendly interactions
- ✅ Adaptive navigation

## 🔐 Security Features

- ✅ CORS configuration
- ✅ Input validation
- ✅ XSS protection
- ✅ Secure token storage
- ✅ API rate limiting

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t healthbridge-frontend .
docker run -p 3001:3001 healthbridge-frontend
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Performance Optimizations

- ✅ Next.js automatic code splitting
- ✅ Image optimization
- ✅ Font optimization
- ✅ Bundle analysis
- ✅ Lazy loading components

## 🔄 Integration Status

| Component | Status | Description |
|-----------|--------|-------------|
| Landing Page | ✅ Ready | Role selection and login |
| Citizen Dashboard | ✅ Ready | AI symptom analysis |
| ASHA Dashboard | ✅ Ready | Patient management |
| Login System | ✅ Ready | OTP-based authentication |
| API Service | ✅ Ready | Backend/AI integration |
| UI Components | ✅ Ready | shadcn/ui components |
| Routing | ✅ Ready | Next.js App Router |
| TypeScript | ✅ Ready | Type safety |
| Responsive Design | ✅ Ready | Mobile-first |

## 📞 Support

If you encounter any issues:
1. Check the test page: http://localhost:3001/test
2. Verify all services are running
3. Check browser console for errors
4. Review the integration logs

Your Next.js application is now fully configured and ready for development! 🎉