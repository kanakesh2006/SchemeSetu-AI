#!/bin/bash
echo "Starting Government Welfare Schemes Application..."

echo ""
echo "=============================================="
echo "Setting up Python Virtual Environment..."
echo "=============================================="
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Backend Dependencies (if missing)..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
cd ..

echo ""
echo "=============================================="
echo "Installing Frontend Dependencies (if missing)..."
echo "=============================================="
cd frontend
npm install
cd ..

echo ""
echo "=============================================="
echo "Starting Servers..."
echo "=============================================="
# Start backend in background 
cd backend
echo "Starting FastApi Backend on port 8000..."
source venv/bin/activate
python -m uvicorn app_main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend in background
cd frontend
echo "Starting Next.js Frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Setup Complete!"
echo "- Backend API is available at http://localhost:8000"
echo "- Frontend App is available at http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Wait for both background processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT
wait $BACKEND_PID $FRONTEND_PID
