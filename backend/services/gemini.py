import os
import httpx
from typing import List, Optional
from models.chat import ChatMessage
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBED_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-2.5-flash"

def build_scheme_search_text(scheme: dict) -> str:
    """
    Construct a dense, highly informative text chunk for a scheme.
    This chunk will be embedded and used for pgvector semantic search.
    """
    parts = []
    
    # Names in different languages
    parts.append(f"Scheme Name: {scheme.get('name', '')}")
    if scheme.get('name_ta'):
        parts.append(f"Tamil Name: {scheme['name_ta']}")
    if scheme.get('name_hi'):
        parts.append(f"Hindi Name: {scheme['name_hi']}")
        
    parts.append(f"Ministry / Department: {scheme.get('ministry', '')}")
    
    # Benefit Details
    b_type = scheme.get('benefit_type', '').replace('_', ' ').title()
    b_amt = scheme.get('benefit_amount')
    b_freq = scheme.get('benefit_frequency', '')
    if b_amt:
        parts.append(f"Benefits: {b_type} of Rs. {b_amt:,} ({b_freq})")
    else:
        parts.append(f"Benefits: {b_type} (value varies)")
        
    # Eligibility constraints
    states = scheme.get('applicable_states')
    if states:
        parts.append(f"Applicable States: {', '.join(states)}")
    else:
        parts.append("Applicable States: All of India (National Scheme)")
        
    gender = scheme.get('gender')
    if gender and gender != 'any':
        parts.append(f"Target Gender: {gender}")
    else:
        parts.append("Target Gender: All Genders (Male/Female/Other)")
        
    castes = scheme.get('caste_categories')
    if castes:
        parts.append(f"Eligible Castes/Categories: {', '.join(castes)}")
    else:
        parts.append("Eligible Castes/Categories: All Categories (SC, ST, OBC, EWS, General)")
        
    min_age = scheme.get('min_age')
    max_age = scheme.get('max_age')
    if min_age or max_age:
        age_str = "Age Requirement: "
        if min_age:
            age_str += f"above {min_age} years "
        if max_age:
            age_str += f"up to {max_age} years"
        parts.append(age_str.strip())
        
    max_inc = scheme.get('max_income')
    if max_inc:
        parts.append(f"Maximum Annual Household Income Limit: Rs. {max_inc:,}")
        
    occs = scheme.get('occupation_types')
    if occs:
        parts.append(f"Eligible Occupations: {', '.join(occs).replace('_', ' ')}")
    else:
        parts.append("Eligible Occupations: Any Occupation")
        
    docs = scheme.get('documents_required')
    if docs:
        parts.append(f"Documents Required: {', '.join(docs).replace('_', ' ')}")
        
    return " | ".join(parts)


async def generate_embedding(text: str, client: Optional[httpx.AsyncClient] = None) -> List[float]:
    """
    Generate 768-dimensional vector embedding for a given text using
    Google's text-embedding-004 API via REST call.
    """
    if not GEMINI_API_KEY:
        # Fallback dummy embedding of size 768 for development/testing when no key is set
        print("[WARNING] GEMINI_API_KEY not found in environment. Returning mock embedding.")
        return [0.0] * 768

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBED_MODEL}:embedContent?key={GEMINI_API_KEY}"
    
    body = {
        "content": {
            "parts": [
                {
                    "text": text
                }
            ]
        },
        "outputDimensionality": 768
    }
    
    if client is not None:
        try:
            resp = await client.post(url, json=body, timeout=15)
            resp.raise_for_status()
            res_data = resp.json()
            embedding_values = res_data["embedding"]["values"]
            return embedding_values
        except Exception as e:
            print(f"[ERROR] Error generating embedding: {e}")
            raise e
    else:
        async with httpx.AsyncClient() as local_client:
            try:
                resp = await local_client.post(url, json=body, timeout=15)
                resp.raise_for_status()
                res_data = resp.json()
                embedding_values = res_data["embedding"]["values"]
                return embedding_values
            except Exception as e:
                print(f"[ERROR] Error generating embedding: {e}")
                raise e


async def generate_chat_reply(prompt: str, history: List[ChatMessage]) -> str:
    """
    Generate conversational chat reply using Google's gemini-2.5-flash API via REST call.
    Injects chat history formatted for Gemini's developer endpoints.
    """
    if not GEMINI_API_KEY:
        print("[WARNING] GEMINI_API_KEY not found in environment. Returning mock reply.")
        return "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable to test the RAG Chatbot."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{CHAT_MODEL}:generateContent?key={GEMINI_API_KEY}"
    
    contents = []
    
    # Map chat history into Gemini REST format
    for msg in history:
        # Map roles to Gemini roles: 'user' or 'model'
        role = "model" if msg.role in ["assistant", "model", "system"] else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })
        
    # Append the main prompt as the final user content
    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })
    
    body = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 800
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=body, timeout=30)
            resp.raise_for_status()
            res_data = resp.json()
            reply_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return reply_text
        except Exception as e:
            print(f"[ERROR] Error generating chat reply: {e}")
            raise RuntimeError(f"Failed to call Gemini Chat API: {e}")
