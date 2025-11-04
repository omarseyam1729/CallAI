# app/schemas/chunk.py
from pydantic import BaseModel
from typing import List
from .segment import SegmentSchema

class AudioChunkSchema(BaseModel):
    id: int
    call_id: str                     
    chunk_path: str
    start_time: float
    end_time: float
    status: str
    segments: List[SegmentSchema] = []

    class Config:
        orm_mode = True
