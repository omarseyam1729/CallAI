# app/schemas/trigger.py

from typing import Optional, Dict, Any, List
from pydantic import BaseModel


# -----------------------------
# Shared Base Schema
# -----------------------------
class TriggerBase(BaseModel):
    name: str
    type: str  # should be "regex" or "semantic"
    config: Dict[str, Any]
    description: Optional[str] = None


# -----------------------------
# Create & Update Requests
# -----------------------------
class TriggerCreateRequest(TriggerBase):
    pass


class TriggerUpdateRequest(BaseModel):
    name: Optional[str]
    type: Optional[str]
    config: Optional[Dict[str, Any]]
    description: Optional[str]


# -----------------------------
# Evaluation Request
# -----------------------------
class TriggerEvalRequest(BaseModel):
    call_ids: List[str]
    trigger_ids: List[int]


# -----------------------------
# Evaluation Response
# -----------------------------
class TriggerEvalResult(BaseModel):
    call_id: str
    trigger_id: int
    trigger_name: str
    matched: bool
    score: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None


# -----------------------------
# Trigger Response (CRUD)
# -----------------------------
class TriggerResponse(TriggerBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
