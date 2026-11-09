# Leafline Local Launcher PowerShell Script
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================================" -ForegroundColor Green
Write-Host "Starting Leafline Local Development Servers" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host "`nLeafline is live!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
