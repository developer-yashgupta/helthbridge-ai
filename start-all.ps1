# HealthBridge AI - Start All Services
Write-Host "Starting HealthBridge AI Services..." -ForegroundColor Green

# Start Backend (Node.js)
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 3

# Start AI Engine (Python)
Write-Host "Starting AI Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-engine; python enhanced_app.py" -WindowStyle Normal

# Wait for AI engine to start
Start-Sleep -Seconds 3

# Start Frontend (Next.js)
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "AI Engine: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")