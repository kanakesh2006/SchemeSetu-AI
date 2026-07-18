import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

_pool = None


async def connect_db():
    global _pool
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        print("[WARNING] DATABASE_URL environment variable is not set. Supabase database features will be unavailable.")
        return
        
    try:
        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=2,
            max_size=10,
            ssl="require",
            statement_cache_size=0,
        )
        print("[SUCCESS] Supabase database connected")
    except Exception as e:
        print(f"[WARNING] Failed to connect to database: {e}. Running in local offline mode.")
        _pool = None


async def disconnect_db():
    global _pool
    if _pool:
        await _pool.close()
        print("Database disconnected")


def get_pool():
    global _pool
    return _pool