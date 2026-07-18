import asyncio
import os
import sys
from datetime import datetime

# Ensure backend directory is in path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import get_pool
from scrapers.myscheme import run_scraper
from services.gemini import build_scheme_search_text, generate_embedding

async def run_scraping_pipeline(max_schemes: int = 5):
    """
    Scrapes fresh schemes, imports them into PostgreSQL (skipping duplicates),
    and generates vector embeddings for new schemes.
    """
    print(f"\n[PIPELINE] Starting automated scraping pipeline at {datetime.now()}...")
    
    # 1. Run web scraping
    try:
        scraped_schemes = run_scraper(max_schemes=max_schemes)
        print(f"[PIPELINE] Successfully scraped {len(scraped_schemes)} schemes.")
    except Exception as e:
        print(f"[PIPELINE] [ERROR] Scraping failed: {e}")
        return {"status": "error", "message": f"Scraping failed: {e}"}

    pool = get_pool()
    if pool is None:
        print("[PIPELINE] [WARNING] Database pool is offline. Scraped data saved locally. Embedding generation skipped.")
        return {
            "status": "offline_fallback",
            "message": "Database is offline. Schemes scraped and saved locally as fallback JSON, but not imported to DB.",
            "scraped_count": len(scraped_schemes)
        }

    # 2. Connect to database and import schemes
    inserted_ids = []
    skipped_count = 0
    errors_count = 0

    print("[PIPELINE] Importing schemes to PostgreSQL...")
    async with pool.acquire() as conn:
        for s in scraped_schemes:
            e = s.get("eligibility", {})
            try:
                # Insert the scheme
                result = await conn.execute(
                    """
                    INSERT INTO schemes (
                        scheme_id, name, ministry, benefit_type,
                        benefit_amount, applicable_states,
                        gender, caste_categories,
                        min_age, max_age, max_income, occupation_types,
                        documents_required, application_url,
                        is_rolling, verified_at, active
                    ) VALUES (
                        $1, $2, $3, $4,
                        $5, $6,
                        $7, $8,
                        $9, $10, $11, $12,
                        $13, $14,
                        $15, $16, $17
                    )
                    ON CONFLICT (scheme_id) DO NOTHING
                    """,
                    s["scheme_id"],
                    s["name"],
                    s.get("ministry", ""),
                    s.get("benefit_type", "other"),
                    s.get("benefit_amount"),
                    e.get("applicable_states"),
                    e.get("gender"),
                    e.get("caste_categories"),
                    e.get("min_age"),
                    e.get("max_age"),
                    e.get("max_income"),
                    e.get("occupation_types"),
                    s.get("documents_required"),
                    s.get("application_url"),
                    s.get("is_rolling", True),
                    s.get("verified_at"),
                    s.get("active", True),
                )
                
                # check if row was actually inserted
                # asyncpg returns 'INSERT 0 1' if inserted, 'INSERT 0 0' if skipped
                if result == 'INSERT 0 1':
                    inserted_ids.append((s["scheme_id"], s))
                    print(f"  [DB] Inserted scheme: {s['scheme_id']}")
                else:
                    skipped_count += 1
            except Exception as ex:
                errors_count += 1
                print(f"  [DB] [ERROR] Failed to insert {s['scheme_id']}: {ex}")

        # 3. Generate embeddings for newly inserted schemes
        embeddings_success = 0
        embeddings_errors = 0
        
        # Check if any existing active schemes lack embeddings, and embed those too
        unembedded_rows = await conn.fetch(
            "SELECT * FROM schemes WHERE active = TRUE AND embedding IS NULL"
        )
        unembedded_schemes = [dict(r) for r in unembedded_rows]
        
        total_to_embed = len(inserted_ids) + len(unembedded_schemes)
        if total_to_embed > 0:
            print(f"[PIPELINE] Generating text embeddings for {total_to_embed} schemes using Gemini...")
            
            # Embed newly inserted schemes
            for sid, scheme in inserted_ids:
                search_text = build_scheme_search_text(scheme)
                try:
                    vector = await generate_embedding(search_text)
                    await conn.execute(
                        "UPDATE schemes SET embedding = $1 WHERE scheme_id = $2",
                        str(vector), sid
                    )
                    embeddings_success += 1
                    print(f"  [AI] Generated embedding for new scheme: {sid}")
                except Exception as e:
                    embeddings_errors += 1
                    print(f"  [AI] [ERROR] Failed embedding for {sid}: {e}")
            
            # Embed older active schemes that lack embeddings
            for scheme in unembedded_schemes:
                sid = scheme["scheme_id"]
                search_text = build_scheme_search_text(scheme)
                try:
                    vector = await generate_embedding(search_text)
                    await conn.execute(
                        "UPDATE schemes SET embedding = $1 WHERE scheme_id = $2",
                        str(vector), sid
                    )
                    embeddings_success += 1
                    print(f"  [AI] Generated embedding for existing scheme: {sid}")
                except Exception as e:
                    embeddings_errors += 1
                    print(f"  [AI] [ERROR] Failed embedding for {sid}: {e}")

    print(f"\n[PIPELINE] Execution Complete.")
    print(f"  Inserted:           {len(inserted_ids)}")
    # Extract only the IDs for returning in response
    inserted_only_ids = [item[0] for item in inserted_ids]
    print(f"  Skipped (existing): {skipped_count}")
    print(f"  Import Errors:      {errors_count}")
    print(f"  Embeddings Saved:   {embeddings_success}")
    print(f"  Embedding Errors:   {embeddings_errors}")
    
    return {
        "status": "success",
        "inserted_count": len(inserted_ids),
        "inserted_ids": inserted_only_ids,
        "skipped_count": skipped_count,
        "import_errors": errors_count,
        "embeddings_success": embeddings_success,
        "embeddings_errors": embeddings_errors
    }
