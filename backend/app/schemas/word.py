from typing import Optional
from pydantic import BaseModel

class WordSchema(BaseModel):
    id: int
    segment_id: int
    word: str
    start: float
    end: float
    confidence: Optional[float]

    class Config:
        orm_mode = True
