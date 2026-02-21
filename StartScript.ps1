# StartScript.ps1
# This script forcefully binds Node and Go to your current terminal session

$env:Path = $env:Path + ";C:\Program Files\nodejs\;C:\Program Files\Go\bin;C:\go\bin"

Write-Host "==========================="
Write-Host " EXPENSE TRACKER LAUNCHER  "
Write-Host "==========================="
Write-Host "1. Start Backend (Go)"
Write-Host "2. Start Frontend (React/Vite)"
Write-Host "3. Start Both"
Write-Host "==========================="

$choice = Read-Host "Enter choice (1, 2, or 3)"

if ($choice -eq "1") {
    Write-Host "Starting Go Backend..." -ForegroundColor Green
    Set-Location -Path "backend"
    go run main.go
}
elseif ($choice -eq "2") {
    Write-Host "Starting React Frontend..." -ForegroundColor Blue
    Set-Location -Path "frontend"
    npm run dev
}
elseif ($choice -eq "3") {
    Write-Host "Starting Both!" -ForegroundColor Magenta
    
    # Start backend in new window with the path injected
    Start-Process powershell -ArgumentList "-NoExit -Command `$env:Path += ';C:\Program Files\nodejs\;C:\Program Files\Go\bin;C:\go\bin'; cd backend; go run main.go"
    
    # Start frontend in new window with the path injected
    Start-Process powershell -ArgumentList "-NoExit -Command `$env:Path += ';C:\Program Files\nodejs\;C:\Program Files\Go\bin;C:\go\bin'; cd frontend; npm run dev"
}
else {
    Write-Host "Invalid choice." -ForegroundColor Red
}
