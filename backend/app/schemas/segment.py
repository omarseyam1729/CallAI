# app/schemas/segment.py
from pydantic import BaseModel
from typing import List, Optional
from .word import WordSchema

class SegmentSchema(BaseModel):
    id: int
    chunk_id: int
    speaker: str
    start: float
    end: float
    text: Optional[str]
    words: List[WordSchema] = []

    class Config:
        orm_mode = True
