from pydantic import BaseModel
from typing import Optional, List
from models.scheme import UserProfile

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    user_profile: Optional[UserProfile] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    reply: str
    matched_schemes: List[str] = []  # list of scheme_id strings references
