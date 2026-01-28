@echo off
echo Starting HealthBridge AI Development Environment...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting AI Engine...
start "AI Engine" cmd /k "cd ai-engine && python app.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo All services started!
echo Backend: http://localhost:3000
echo AI Engine: http://localhost:5000
echo Frontend Metro: http://localhost:8081
echo.
pause