import asyncio
import asyncpg
import os
import sys
import httpx
import time

# Ensure backend directory is in the import path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.gemini import build_scheme_search_text, generate_embedding
from dotenv import load_dotenv

load_dotenv(os.path.join(BACKEND_DIR, ".env"))


async def embed_single_scheme(conn, scheme, client, index, total):
    """Embed a single scheme and save to DB. Returns True on success."""
    scheme_id = scheme["scheme_id"]
    name = scheme["name"]
    search_text = build_scheme_search_text(scheme)

    vector = None
    for attempt in range(5):
        try:
            vector = await generate_embedding(search_text, client=client)
            break
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "Too Many Requests" in err_str:
                sleep_time = 15 * (attempt + 1)
                print(f"  [RATE LIMIT] 429 on attempt {attempt+1}/5 for '{name}'. Sleeping {sleep_time}s...", flush=True)
                await asyncio.sleep(sleep_time)
            else:
                print(f"  [ERROR] Non-rate-limit error on '{name}': {e}", flush=True)
                await asyncio.sleep(2.0 * (attempt + 1))

    if not vector or all(v == 0.0 for v in vector):
        print(f"  [FAILED] No vector for: {name} ({scheme_id})", flush=True)
        return False

    # Save to database
    for attempt in range(3):
        try:
            await conn.execute(
                "UPDATE schemes SET embedding = $1 WHERE scheme_id = $2",
                str(vector),
                scheme_id
            )
            return True
        except Exception as e:
            await asyncio.sleep(1.0 * (attempt + 1))

    print(f"  [DB ERROR] Failed to save embedding for: {name} ({scheme_id})", flush=True)
    return False


async def generate_all_embeddings():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[ERROR] DATABASE_URL not set in environment.", flush=True)
        return

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("[ERROR] GEMINI_API_KEY not set in environment.", flush=True)
        return

    print("Connecting to database to fetch schemes...", flush=True)
    try:
        conn = await asyncpg.connect(dsn=db_url, ssl="require", statement_cache_size=0)
        rows = await conn.fetch("SELECT * FROM schemes WHERE active = TRUE AND (embedding IS NULL)")
        print(f"[SUCCESS] Fetched {len(rows)} schemes to embed.", flush=True)
    except Exception as e:
        print(f"[ERROR] Database error: {e}", flush=True)
        return

    if not rows:
        print("All schemes are already embedded!", flush=True)
        await conn.close()
        return

    total = len(rows)
    success = 0
    failed = 0
    start_time = time.time()

    # Process schemes ONE AT A TIME in a simple loop.
    # This avoids the asyncio.gather thundering-herd problem where
    # thousands of coroutines compete for a semaphore and cascade 429s.
    async with httpx.AsyncClient() as client:
        for i, row in enumerate(rows):
            scheme = dict(row)
            ok = await embed_single_scheme(conn, scheme, client, i, total)
            if ok:
                success += 1
            else:
                failed += 1

            curr = success + failed
            if curr % 25 == 0 or curr == total:
                elapsed = time.time() - start_time
                rate = curr / elapsed * 60 if elapsed > 0 else 0
                print(f"  [PROGRESS] {curr}/{total} done ({success} ok, {failed} fail) | {rate:.0f} req/min | {elapsed:.0f}s elapsed", flush=True)

            # Pace: ~50 RPM to stay well under 100 RPM free-tier limit
            await asyncio.sleep(1.2)

    await conn.close()
    elapsed = time.time() - start_time
    print(f"\n=== Embedding Job Complete ===", flush=True)
    print(f"  Total time:   {elapsed:.0f}s ({elapsed/60:.1f} min)", flush=True)
    print(f"  Success:      {success}", flush=True)
    print(f"  Failed:       {failed}", flush=True)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(generate_all_embeddings())
