import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from database import connect_db, disconnect_db
from routers import health, schemes, chat, centers

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Welfare App API",
    description="Backend API for the India Welfare Schemes platform",
    version="1.0.0",
    lifespan=lifespan,
)

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")
allowed_origins = [o.strip().rstrip("/") for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(schemes.router, prefix="/schemes", tags=["schemes"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(centers.router, prefix="/centers", tags=["centers"])


@app.get("/")
async def root():
    return {
        "app": "Welfare Schemes API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }