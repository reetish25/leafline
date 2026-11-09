@echo off
setlocal
echo ========================================================
echo Starting Leafline Local Development Servers
echo ========================================================
echo.

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
powershell -NoProfile -Command "Start-Process -WorkingDirectory '%~dp0backend' -FilePath '%~dp0backend\venv\Scripts\python.exe' -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'"

rem Wait 2 seconds for backend to initialize
ping -n 3 127.0.0.1 >nul

echo [2/2] Launching React+Vite Frontend on http://localhost:5173...
powershell -NoProfile -Command "Start-Process -WorkingDirectory '%~dp0frontend' -FilePath 'cmd.exe' -ArgumentList '/c', 'npm', 'run', 'dev'"

echo.
echo ========================================================
echo Leafline is now running!
echo Access the web app at: http://localhost:5173
echo Backend API docs at:   http://127.0.0.1:8000/docs
echo ========================================================
