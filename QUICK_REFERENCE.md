# 🚀 HealthBridge AI - Quick Reference

## Start Application
```powershell
.\start-all.ps1
```

## Service URLs
- Frontend:  http://localhost:3001
- Backend:   http://localhost:3000
- AI Engine: http://localhost:5000

## Verify Setup
```powershell
.\verify-config.ps1
```

## Test Integration
```powershell
node test-integration.js
```

## Manual Start
```powershell
# Terminal 1
cd backend && npm start

# Terminal 2
cd ai-engine && python app.py

# Terminal 3
cd frontend && npm run dev
```

## Key Files
- `frontend/.env.local` - Frontend config
- `backend/.env` - Backend config
- `INTEGRATION_COMPLETE.md` - Full guide

## Status
✅ Backend-Frontend integration COMPLETE
✅ All CORS configured
✅ Environment variables set
✅ Ready to use!
