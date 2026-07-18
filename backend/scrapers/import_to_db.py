"""
Import scraped schemes JSON into the Supabase database.

Usage:
    python scrapers/import_to_db.py

Reads from: scrapers/output/schemes_scraped.json
Inserts into: schemes table (skips duplicates by scheme_id)
"""

import asyncio
import asyncpg
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


async def import_schemes():
    input_path = "scrapers/output/schemes_scraped.json"

    if not os.path.exists(input_path):
        print(f"[ERROR] File not found: {input_path}")
        print("   Run: python scrapers/myscheme.py first")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    total = len(schemes)
    print(f"[INFO] Loaded {total} schemes from {input_path}")

    conn = await asyncpg.connect(dsn=os.getenv("DATABASE_URL"), ssl="require")

    inserted = 0
    updated = 0
    errors = 0

    for idx, s in enumerate(schemes, 1):
        try:
            # Fields are at the top level in scraper output (not nested)
            verified = None
            if s.get("verified_at"):
                verified = datetime.strptime(s["verified_at"], "%Y-%m-%d").date()

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
                ON CONFLICT (scheme_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    ministry = EXCLUDED.ministry,
                    benefit_type = EXCLUDED.benefit_type,
                    benefit_amount = EXCLUDED.benefit_amount,
                    applicable_states = EXCLUDED.applicable_states,
                    gender = EXCLUDED.gender,
                    caste_categories = EXCLUDED.caste_categories,
                    min_age = EXCLUDED.min_age,
                    max_age = EXCLUDED.max_age,
                    max_income = EXCLUDED.max_income,
                    occupation_types = EXCLUDED.occupation_types,
                    documents_required = EXCLUDED.documents_required,
                    application_url = EXCLUDED.application_url,
                    is_rolling = EXCLUDED.is_rolling,
                    verified_at = EXCLUDED.verified_at,
                    active = EXCLUDED.active
                """,
                s["scheme_id"],
                s["name"],
                s.get("ministry", ""),
                s.get("benefit_type", "other"),
                s.get("benefit_amount"),
                s.get("applicable_states"),
                s.get("gender"),
                s.get("caste_categories"),
                s.get("min_age"),
                s.get("max_age"),
                s.get("max_income"),
                s.get("occupation_types"),
                s.get("documents_required"),
                s.get("application_url"),
                s.get("is_rolling", True),
                verified,
                s.get("active", True),
            )
            if "UPDATE" in result:
                updated += 1
            else:
                inserted += 1

            if idx % 25 == 0 or idx == total:
                print(f"  [{idx}/{total}] progress...")

        except Exception as ex:
            errors += 1
            sid = s.get("scheme_id", "?")
            print(f"  [ERROR] on {sid}: {ex}")

    await conn.close()

    print(f"\n-- Import complete ------------------")
    print(f"  Total:    {total}")
    print(f"  Inserted: {inserted}")
    print(f"  Updated:  {updated}")
    print(f"  Errors:   {errors}")


if __name__ == "__main__":
    asyncio.run(import_schemes())