from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from database import get_pool
from models.scheme import UserProfile, MatchRequest
from services.matcher import is_eligible, explain_mismatch
from services.pipeline import run_scraping_pipeline

router = APIRouter()

@router.post("/sync-scraped")
async def sync_scraped_schemes(background_tasks: BackgroundTasks, max_schemes: int = Query(5, ge=1, le=50)):
    """
    Triggers the scraper pipeline in a background task to fetch new schemes,
    save/insert them, and generate embeddings.
    """
    background_tasks.add_task(run_scraping_pipeline, max_schemes)
    return {
        "status": "started",
        "message": f"Scraper pipeline execution triggered in background (collecting up to {max_schemes} schemes)."
    }



@router.post("/match")
async def match_schemes(request: MatchRequest):
    pool = get_pool()
    user = request.user_profile
    lang = request.language or "en"

    schemes_list = []
    
    # Graceful fallback to local MOCK_SCHEMES if Supabase is offline
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        schemes_list = MOCK_SCHEMES
    else:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    scheme_id, name, name_ta, name_hi,
                    ministry, benefit_type,
                    benefit_amount, benefit_frequency,
                    applicable_states, gender, caste_categories,
                    min_age, max_age, max_income, occupation_types,
                    documents_required, application_url,
                    application_deadline, is_rolling
                FROM schemes
                WHERE active = TRUE
                ORDER BY name
                """
            )
            schemes_list = [dict(row) for row in rows]

    matched = []
    for scheme in schemes_list:
        if is_eligible(user, scheme):
            if lang == "ta" and scheme.get("name_ta"):
                display_name = scheme["name_ta"]
            elif lang == "hi" and scheme.get("name_hi"):
                display_name = scheme["name_hi"]
            else:
                display_name = scheme["name"]

            # Calculate specificity (accuracy/relevance) score of demographic criteria matching
            spec_score = 0
            # States specificity
            states = scheme.get("applicable_states")
            if states and "All" not in states:
                spec_score += 2
            # Gender specificity
            gender = scheme.get("gender")
            if gender and gender != "any":
                spec_score += 2
            # Caste specificity
            caste = scheme.get("caste_categories")
            if caste and "All" not in caste:
                spec_score += 2
            # Age specificity
            if scheme.get("min_age") is not None or scheme.get("max_age") is not None:
                spec_score += 1
            # Income specificity
            if scheme.get("max_income") is not None:
                spec_score += 2
            # Occupation specificity
            occ = scheme.get("occupation_types")
            if occ and "All" not in occ:
                spec_score += 2

            matched.append({
                "scheme_id":            scheme["scheme_id"],
                "name":                 display_name,
                "name_en":              scheme["name"],
                "ministry":             scheme["ministry"],
                "benefit_type":         scheme["benefit_type"],
                "benefit_amount":       scheme["benefit_amount"],
                "benefit_frequency":    scheme["benefit_frequency"],
                "application_url":      scheme["application_url"],
                "application_deadline": str(scheme["application_deadline"])
                                        if scheme.get("application_deadline") else None,
                "is_rolling":           scheme.get("is_rolling", True),
                "documents_required":   scheme["documents_required"],
                "_spec_score":          spec_score,
            })

    # Sort matched schemes:
    # 1. Higher specificity/accuracy score first
    # 2. Higher benefit amount first
    # 3. Alphabetical order by name
    matched.sort(
        key=lambda x: (
            -x["_spec_score"],
            -(x["benefit_amount"] or 0),
            x["name"]
        )
    )

    return {
        "total":      len(matched),
        "schemes":    matched,
        "user_state": user.state,
    }


@router.get("/search")
async def search_schemes(q: str = Query(min_length=2)):
    pool = get_pool()
    
    # Fallback search locally
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        results = [
            s for s in MOCK_SCHEMES
            if q.lower() in s["name"].lower() or
               (s.get("name_ta") and q.lower() in s["name_ta"].lower()) or
               (s.get("name_hi") and q.lower() in s["name_hi"].lower()) or
               q.lower() in s["ministry"].lower()
        ]
        return {"query": q, "results": results}
        
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT scheme_id, name, name_ta, name_hi,
                   ministry, benefit_type,
                   benefit_amount, application_url, is_rolling
            FROM schemes
            WHERE active = TRUE
              AND (
                name ILIKE $1
                OR name_ta ILIKE $1
                OR name_hi ILIKE $1
                OR ministry ILIKE $1
              )
            ORDER BY name
            LIMIT 20
            """,
            f"%{q}%",
        )
    return {"query": q, "results": [dict(r) for r in rows]}


@router.get("/semantic-search")
async def semantic_search_schemes(q: str = Query(min_length=2), lang: str = "en"):
    pool = get_pool()
    
    # Local fallback for semantic search
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        results = []
        for idx, scheme in enumerate(MOCK_SCHEMES):
            # Calculate mock similarity based on query word occurrences
            words_matched = sum(1 for w in q.lower().split() if w in scheme["name"].lower() or w in scheme["ministry"].lower())
            score = 0.85 - (idx * 0.04) + (words_matched * 0.05)
            score = max(0.55, min(0.98, score))
            
            # Select appropriate display name
            if lang == "ta" and scheme.get("name_ta"):
                display_name = scheme["name_ta"]
            elif lang == "hi" and scheme.get("name_hi"):
                display_name = scheme["name_hi"]
            else:
                display_name = scheme["name"]
                
            results.append({
                "scheme_id":            scheme["scheme_id"],
                "name":                 display_name,
                "name_en":              scheme["name"],
                "ministry":             scheme["ministry"],
                "benefit_type":         scheme["benefit_type"],
                "benefit_amount":       scheme["benefit_amount"],
                "benefit_frequency":    scheme.get("benefit_frequency"),
                "application_url":      scheme.get("application_url"),
                "is_rolling":           scheme.get("is_rolling", True),
                "documents_required":   scheme.get("documents_required", []),
                "similarity":           round(score, 4)
            })
        
        # Sort results by mock similarity score
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {"query": q, "results": results}

    from services.gemini import generate_embedding
    try:
        query_vector = await generate_embedding(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate query vector: {e}")
        
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                scheme_id, name, name_ta, name_hi,
                ministry, benefit_type, benefit_amount, benefit_frequency,
                applicable_states, gender, caste_categories,
                min_age, max_age, max_income, occupation_types,
                documents_required, application_url, is_rolling,
                1 - (embedding <=> $1) as similarity
            FROM schemes
            WHERE active = TRUE AND embedding IS NOT NULL
            ORDER BY embedding <=> $1
            LIMIT 10
            """,
            str(query_vector)
        )
        
    results = []
    for r in rows:
        scheme = dict(r)
        
        # Select appropriate display name
        if lang == "ta" and scheme.get("name_ta"):
            display_name = scheme["name_ta"]
        elif lang == "hi" and scheme.get("name_hi"):
            display_name = scheme["name_hi"]
        else:
            display_name = scheme["name"]
            
        results.append({
            "scheme_id":            scheme["scheme_id"],
            "name":                 display_name,
            "name_en":              scheme["name"],
            "ministry":             scheme["ministry"],
            "benefit_type":         scheme["benefit_type"],
            "benefit_amount":       scheme["benefit_amount"],
            "benefit_frequency":    scheme["benefit_frequency"],
            "application_url":      scheme["application_url"],
            "is_rolling":           scheme["is_rolling"],
            "documents_required":   scheme["documents_required"],
            "similarity":           round(float(scheme["similarity"] or 0), 4)
        })
        
    return {
        "query": q,
        "results": results
    }


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str):
    pool = get_pool()
    
    # Fallback details locally
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        scheme = next((s for s in MOCK_SCHEMES if s["scheme_id"] == scheme_id), None)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        # Return a copy to mutate date fields
        scheme_copy = dict(scheme)
        for date_field in ["application_deadline", "verified_at", "created_at", "updated_at"]:
            if scheme_copy.get(date_field):
                scheme_copy[date_field] = str(scheme_copy[date_field])
        return scheme_copy

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM schemes WHERE scheme_id = $1 AND active = TRUE",
            scheme_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme = dict(row)
    for date_field in ["application_deadline", "verified_at", "created_at", "updated_at"]:
        if scheme.get(date_field):
            scheme[date_field] = str(scheme[date_field])
    return scheme


@router.post("/check/{scheme_id}")
async def check_single_scheme(scheme_id: str, user: UserProfile):
    pool = get_pool()
    scheme = None
    
    # Fallback eligibility locally
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        scheme = next((s for s in MOCK_SCHEMES if s["scheme_id"] == scheme_id), None)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
    else:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM schemes WHERE scheme_id = $1 AND active = TRUE",
                scheme_id,
            )
        if not row:
            raise HTTPException(status_code=404, detail="Scheme not found")
        scheme = dict(row)

    eligible = is_eligible(user, scheme)
    reasons = [] if eligible else explain_mismatch(user, scheme)

    return {
        "scheme_id": scheme_id,
        "name":      scheme["name"],
        "eligible":  eligible,
        "reasons":   reasons,
    }

