from fastapi import APIRouter
from database import get_pool

router = APIRouter()


@router.get("/health")
async def health_check():
    pool = get_pool()
    if pool is None:
        return {
            "status": "ok",
            "database": "offline",
            "mode": "fallback",
        }

    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "mode": "database" if db_status == "connected" else "degraded",
    }
