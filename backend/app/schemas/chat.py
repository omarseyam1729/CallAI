# app/schemas/chat.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []

class ChatMessageResponse(BaseModel):
    answer: str
    query_used: Optional[str] = None
    timestamp: datetime

