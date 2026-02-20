@echo off
set "PATH=%PATH%;C:\Program Files\nodejs\;C:\Program Files\Go\bin"

echo =========================================
echo EXPENSE TRACKER LAUNCHER
echo =========================================
echo 1. Start Backend (Go)
echo 2. Start Frontend (React/Vite)
echo 3. Start Both
echo =========================================
set /p choice="Enter choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo Starting Backend...
    cd backend
    go run main.go
) else if "%choice%"=="2" (
    echo Starting Frontend...
    cd frontend
    npm run dev
) else if "%choice%"=="3" (
    echo Starting Both...
    start cmd /k "cd backend && go run main.go"
    start cmd /k "cd frontend && npm run dev"
) else (
    echo Invalid choice.
)
pause
