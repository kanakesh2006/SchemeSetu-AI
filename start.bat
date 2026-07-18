@echo off
title Government Welfare Schemes App
echo Starting Government Welfare Schemes Application...

echo.
echo ==============================================
echo Setting up Python Virtual Environment...
echo ==============================================
cd backend
if not exist venv (
    echo Creating virtual environment...
    py -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Backend Dependencies (if missing)...
venv\Scripts\python -m pip install --upgrade pip
venv\Scripts\python -m pip install -r requirements.txt
cd ..

echo.
echo ==============================================
echo Installing Frontend Dependencies (if missing)...
echo ==============================================
cd frontend
call npm install
cd ..

echo.
echo ==============================================
echo Starting Servers...
echo ==============================================
echo Starting FastApi Backend on port 8000...
start "Backend API" cmd /k "cd backend && call venv\Scripts\activate.bat && python -m uvicorn app_main:app --reload --port 8000"

echo Starting Next.js Frontend on port 3000...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo Setup Complete!
echo - Backend API will be available at http://localhost:8000
echo - Frontend App will be available at http://localhost:3000
echo Close this window to exit (background server windows will remain open until closed manually).
echo.
pause
