@echo off
echo Installing HealthBridge AI Dependencies...

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing AI Engine Dependencies...
cd ../ai-engine
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing AI engine dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Installing Frontend Dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

echo.
echo ✅ All dependencies installed successfully!
echo.
echo Next steps:
echo 1. Run: start-all.bat
echo 2. Open: http://localhost:3001
echo.
pause