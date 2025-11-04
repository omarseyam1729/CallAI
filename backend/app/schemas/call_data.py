from pydantic import BaseModel
from typing import Optional


class CallDataResponse(BaseModel):
    call_id: str

    # metadata
    call_name: Optional[str] = None
    call_description: Optional[str] = None
    agent_id: Optional[int] = None

    # analysis outputs
    full_transcript: Optional[str] = None
    llm_summary: Optional[str] = None
    sentiment_label: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    emotion_label: Optional[str] = None
    emotion_confidence: Optional[float] = None

    class Config:
        orm_mode = True
