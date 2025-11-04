# app/schemas/metrics.py
from pydantic import BaseModel
from datetime import datetime
from typing import Dict

class OverviewMetrics(BaseModel):
    total_words: int
    total_calls: int
    total_segments: int
    total_duration_sec: int
    completed_chunks: int
    pending_chunks: int                 # <-- NEW FIELD
    sentiments: Dict[str, int]
    emotions: Dict[str, int]

    # Trigger metrics
    total_triggers: int
    total_trigger_evals: int
    triggers_matched: int
    triggers_unmatched: int

    generated_at: datetime

    class Config:
        from_attributes = True
