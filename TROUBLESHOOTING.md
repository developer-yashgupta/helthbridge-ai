# HealthBridge AI - Troubleshooting Guide

## 🚨 Common TypeScript Errors

### 1. "Cannot find module 'react'" Error

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 2. "Cannot find module 'lucide-react'" Error

**Solution:**
```bash
cd frontend
npm install lucide-react@latest
```

### 3. Badge Component Type Errors

The Badge component expects specific variant types. Use:
- `variant="default"`
- `variant="secondary"`  
- `variant="destructive"`
- `variant="outline"`

**Correct Usage:**
```tsx
<Badge variant="secondary">Status</Badge>
```

### 4. Process Environment Variables Error

**Solution:** Add to `frontend/next-env.d.ts`:
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_AI_ENGINE_URL?: string;
  }
}
```

## 🔧 Quick Fixes

### Reset Everything
```bash
# Windows
fix-typescript.bat

# Manual
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Install All Dependencies
```bash
# Windows
install-dependencies.bat

# PowerShell  
.\install-dependencies.ps1
```

### Check Service Status
```bash
# Test all services
node test-integration.js

# Or visit: http://localhost:3001/test
```

## 🐛 Specific Error Solutions

### Error: "JSX element implicitly has type 'any'"

**Cause:** Missing React import or JSX configuration

**Solution:**
```tsx
import React from 'react';
// Add to top of every component file
```

### Error: "Property 'variant' does not exist on type 'BadgeProps'"

**Cause:** Incorrect Badge component usage

**Solution:**
```tsx
// ❌ Wrong
<Badge variant="custom">Text</Badge>

// ✅ Correct  
<Badge variant="secondary">Text</Badge>
```

### Error: "Cannot find name 'process'"

**Cause:** Node.js types not properly configured

**Solution:**
```bash
npm install --save-dev @types/node
```

## 🚀 Service Startup Issues

### Backend Won't Start (Port 3000)

**Check:**
1. Is MongoDB running?
2. Is port 3000 available?
3. Are environment variables set?

**Solution:**
```bash
cd backend
npm install
npm start
```

### AI Engine Won't Start (Port 5000)

**Check:**
1. Is Python 3.8+ installed?
2. Are Python dependencies installed?
3. Is port 5000 available?

**Solution:**
```bash
cd ai-engine
pip install -r requirements.txt
python app.py
```

### Frontend Won't Start (Port 3001)

**Check:**
1. Is Node.js 18+ installed?
2. Are npm dependencies installed?
3. Is port 3001 available?

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 Browser Issues

### Page Won't Load

1. Check browser console for errors
2. Verify all services are running
3. Clear browser cache
4. Try incognito/private mode

### API Calls Failing

1. Check CORS settings
2. Verify API URLs in `.env.local`
3. Check network tab in browser dev tools
4. Test API endpoints directly

## 🔍 Debugging Steps

### 1. Check Service Health
```bash
# Backend
curl http://localhost:3000/health

# AI Engine  
curl http://localhost:5000/health

# Frontend
curl http://localhost:3001
```

### 2. Check Logs
- Backend: Check terminal running `npm start`
- AI Engine: Check terminal running `python app.py`
- Frontend: Check browser console and terminal running `npm run dev`

### 3. Verify Environment Variables
```bash
# Check frontend/.env.local
cat frontend/.env.local

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
# NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:5000
```

## 🆘 Still Having Issues?

### Complete Reset
```bash
# Stop all services (Ctrl+C in terminals)

# Clean everything
rm -rf frontend/node_modules frontend/.next
rm -rf backend/node_modules  
rm -rf ai-engine/__pycache__

# Reinstall everything
.\install-dependencies.ps1

# Start fresh
.\start-all.ps1
```

### Check System Requirements
- ✅ Node.js 18+
- ✅ Python 3.8+
- ✅ npm 8+
- ✅ pip 21+
- ✅ 8GB+ RAM
- ✅ Ports 3000, 3001, 5000 available

### Test Individual Components
1. **Test Backend Only:**
   ```bash
   cd backend && npm start
   # Visit: http://localhost:3000/health
   ```

2. **Test AI Engine Only:**
   ```bash
   cd ai-engine && python app.py
   # Visit: http://localhost:5000/health
   ```

3. **Test Frontend Only:**
   ```bash
   cd frontend && npm run dev
   # Visit: http://localhost:3001/test
   ```

## 📞 Getting Help

If none of these solutions work:

1. **Check the test page:** http://localhost:3001/test
2. **Review browser console errors**
3. **Check terminal output for all services**
4. **Verify all dependencies are installed**
5. **Try a complete system restart**

The application should work properly once all TypeScript errors are resolved and all services are running correctly.