# app/schemas/search.py
from pydantic import BaseModel
from typing import Optional, List

class KeywordSearchRequest(BaseModel):
    query: str
    call_id: Optional[str] = None
    top_k: int = 10

class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    # you can add call_id later if you want to filter per call

class SearchResult(BaseModel):
    segment_id: int
    call_id: str
    text: str
    speaker: Optional[str] = None
    start: float
    end: float
    duration: float
    score: float
