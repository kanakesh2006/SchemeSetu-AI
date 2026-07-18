from fastapi import APIRouter, HTTPException
from database import get_pool
from models.chat import ChatRequest, ChatResponse, ChatMessage
from services.gemini import generate_embedding, generate_chat_reply

router = APIRouter()

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
}

@router.post("", response_model=ChatResponse)
async def chat_counselor(request: ChatRequest):
    pool = get_pool()
    query = request.message
    lang = request.language or "en"
    lang_name = LANGUAGE_NAMES.get(lang, "English")
    
    schemes_list = []
    matched_schemes = []
    
    # 1. Graceful fallback for Chat retrieval if Supabase is offline
    if pool is None:
        from services.fallback_data import MOCK_SCHEMES
        # Perform heuristic keyword matching to score relevant schemes
        scored = []
        for s in MOCK_SCHEMES:
            # Check how many query words match the scheme name or ministry
            match_score = sum(1 for w in query.lower().split() if w in s["name"].lower() or w in s["ministry"].lower())
            if match_score > 0:
                scored.append((match_score, s))
        # Sort by match score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        # Choose top 2 relevant schemes as context (only if any actually matched)
        schemes_list = [item[1] for item in scored[:2]]
    else:
        # 1.1 Generate embedding for the user's chat message
        try:
            query_vector = await generate_embedding(query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process query vector: {e}")
            
        # 1.2 Retrieve top 3 most semantically similar active schemes from DB
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    scheme_id, name, name_ta, name_hi,
                    ministry, benefit_type, benefit_amount, benefit_frequency,
                    applicable_states, gender, caste_categories,
                    min_age, max_age, max_income, occupation_types,
                    documents_required, application_url
                FROM schemes
                WHERE active = TRUE AND embedding IS NOT NULL
                ORDER BY embedding <=> $1
                LIMIT 3
                """,
                str(query_vector)
            )
            schemes_list = [dict(r) for r in rows]
            
    # 2. Format context string & record matched scheme ids
    schemes_context = []
    for scheme in schemes_list:
        matched_schemes.append(scheme["scheme_id"])
        
        # Build readable scheme text for Gemini context
        disp_name = scheme["name_ta"] if lang == "ta" and scheme.get("name_ta") else (
                    scheme["name_hi"] if lang == "hi" and scheme.get("name_hi") else scheme["name"])
                    
        desc = (
            f"Scheme ID: {scheme['scheme_id']}\n"
            f"Official Name: {disp_name} (English: {scheme['name']})\n"
            f"Ministry: {scheme['ministry']}\n"
            f"Benefit Type: {scheme['benefit_type']}\n"
            f"Benefit Details: Rs. {scheme['benefit_amount'] or 'Varies'} {scheme.get('benefit_frequency') or ''}\n"
            f"Eligibility Constraints:\n"
            f"  - States: {scheme.get('applicable_states') or 'All India'}\n"
            f"  - Gender: {scheme.get('gender') or 'Any'}\n"
            f"  - Castes/Categories: {scheme.get('caste_categories') or 'All'}\n"
            f"  - Age Limit: {scheme.get('min_age') or 'None'} to {scheme.get('max_age') or 'None'} years\n"
            f"  - Max Household Income Limit: Rs. {scheme.get('max_income') or 'None'}/year\n"
            f"  - Occupations: {scheme.get('occupation_types') or 'Any'}\n"
            f"  - Documents Needed: {scheme.get('documents_required') or 'Standard Identity proofs'}\n"
            f"  - Application URL: {scheme.get('application_url') or 'Not provided'}\n"
        )
        schemes_context.append(desc)
        
    schemes_context_str = "\n\n".join(schemes_context) if schemes_context else "No matching scheme context found."

    # 3. Format User Profile Details if provided
    profile_details = "Not provided by the user."
    if request.user_profile:
        up = request.user_profile
        profile_details = (
            f"- Current State: {up.state}\n"
            f"- Gender: {up.gender}\n"
            f"- Caste Category: {up.caste_category}\n"
            f"- Age: {up.age} years old\n"
            f"- Annual Household Income: Rs. {up.income_annual:,}/year\n"
            f"- Occupation: {up.occupation_type.replace('_', ' ')}"
        )

    # 4. Formulate system prompt for the RAG chat counselor
    prompt = f"""You are a warm, helpful, and highly encouraging AI citizen counselor for the "Information Is Wealth" portal.
Your goal is to explain scheme eligibility criteria and answer the user's queries accurately, in extremely simple everyday language.

Strict Guidelines:
1. Respond ONLY in {lang_name}. Use direct, friendly, conversational everyday terms. No complex terminology or bureaucrat speak.
2. Formulate your response based on the "Retrieved Schemes Context" and check it against the "Citizen Profile" if provided to explain if they are eligible and WHY/WHY NOT.
3. Keep your reply concise (between 3 to 5 sentences max).
4. NEVER ask for or request sensitive personal data (e.g., Aadhaar card numbers, PAN, bank account numbers, passwords, or biometrics). Remind the citizen that their personal data stays fully safe and stored only locally on their own phone!
5. Refrain from listing multiple schemes if only one is relevant. Keep it focused and highly helpful.

Citizen Profile:
{profile_details}

Retrieved Schemes Context:
{schemes_context_str}

User's Question:
"{query}"
"""

    # 5. Request conversational completion from gemini-2.5-flash
    try:
        reply = await generate_chat_reply(prompt, request.history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API execution error: {e}")
        
    # Return conversational reply along with clickable scheme suggestion pills
    return ChatResponse(
        reply=reply,
        matched_schemes=matched_schemes
    )
