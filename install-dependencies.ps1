# HealthBridge AI - Install Dependencies
Write-Host "Installing HealthBridge AI Dependencies..." -ForegroundColor Green

Write-Host ""
Write-Host "[1/3] Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Installing AI Engine Dependencies..." -ForegroundColor Yellow
Set-Location ../ai-engine
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing AI engine dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "[3/3] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\start-all.ps1" -ForegroundColor White
Write-Host "2. Open: http://localhost:3001" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"