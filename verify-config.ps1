# HealthBridge AI - Quick Start Verification
# This script checks if all services are properly configured

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   HealthBridge AI - Configuration Verification" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Frontend .env.local
Write-Host "Checking Frontend Configuration..." -ForegroundColor Yellow
if (Test-Path "frontend\.env.local") {
    Write-Host "[OK] Frontend .env.local exists" -ForegroundColor Green
    $envContent = Get-Content "frontend\.env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_API_URL") {
        Write-Host "[OK] NEXT_PUBLIC_API_URL configured" -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] NEXT_PUBLIC_API_URL not found" -ForegroundColor Red
        $allGood = $false
    }
}
else {
    Write-Host "[ERROR] Frontend .env.local not found" -ForegroundColor Red
    $allGood = $false
}

# Check 2: Backend .env
Write-Host ""
Write-Host "Checking Backend Configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "[OK] Backend .env exists" -ForegroundColor Green
    $backendEnv = Get-Content "backend\.env" -Raw
    if ($backendEnv -match "PORT=3000") {
        Write-Host "[OK] Backend PORT configured (3000)" -ForegroundColor Green
    }
    if ($backendEnv -match "OPENAI_API_KEY" -or $backendEnv -match "GEMINI_API_KEY") {
        Write-Host "[OK] AI API keys configured" -ForegroundColor Green
    }
}
else {
    Write-Host "[ERROR] Backend .env not found" -ForegroundColor Red
    $allGood = $false
}

# Check 3: Node modules
Write-Host ""
Write-Host "Checking Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Frontend dependencies missing" -ForegroundColor Red
    Write-Host "  Run: cd frontend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

if (Test-Path "backend\node_modules") {
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Backend dependencies missing" -ForegroundColor Red
    Write-Host "  Run: cd backend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check 4: Python requirements
Write-Host ""
Write-Host "Checking AI Engine..." -ForegroundColor Yellow
if (Test-Path "ai-engine\app.py") {
    Write-Host "[OK] AI Engine app.py exists" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] AI Engine app.py not found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "SUCCESS! All configurations are correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Start all services: .\start-all.ps1" -ForegroundColor White
    Write-Host "  2. Or start manually:" -ForegroundColor White
    Write-Host "     Terminal 1: cd backend && npm start" -ForegroundColor Gray
    Write-Host "     Terminal 2: cd ai-engine && python app.py" -ForegroundColor Gray
    Write-Host "     Terminal 3: cd frontend && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Access the application:" -ForegroundColor White
    Write-Host "     Frontend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host "     Backend:   http://localhost:3000" -ForegroundColor Cyan
    Write-Host "     AI Engine: http://localhost:5000" -ForegroundColor Cyan
}
else {
    Write-Host "WARNING: Some configurations are missing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix the issues above and run this script again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
