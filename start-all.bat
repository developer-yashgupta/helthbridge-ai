@echo off
echo Starting HealthBridge AI Services...

REM Start Backend (Node.js)
echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start AI Engine (Python)
echo Starting AI Engine...
start "AI Engine" cmd /k "cd ai-engine && python enhanced_app.py"

REM Wait a moment for AI engine to start
timeout /t 3 /nobreak >nul

REM Start Frontend (Next.js)
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services are starting...
echo Backend: http://localhost:3000
echo AI Engine: http://localhost:5000
echo Frontend: http://localhost:3001

pause