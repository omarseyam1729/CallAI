# app/schemas/call.py
from pydantic import BaseModel
from typing import List
from datetime import datetime
from .chunk import AudioChunkSchema

class CallSchema(BaseModel):
    id: str                         
    filename: str
    folder_path: str
    upload_time: datetime
    chunks: List[AudioChunkSchema]

    class Config:
        orm_mode = True
