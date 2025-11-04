# app/routes/pipeline.py

from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.controllers.core.pipeline_controller import run_pipeline_for_call, reset_call

router = APIRouter()

# -------------------------
# Request / Response Models
# -------------------------

class PipelineStepsRequest(BaseModel):
    transcription: Optional[bool] = None
    summary: Optional[bool] = None
    sentiment: Optional[bool] = None
    semantic: Optional[bool] = None


class PipelineRunResponse(BaseModel):
    call_id: str
    steps_run: List[str]
    transcript_len: int
    summary_len: int


class PipelineResetResponse(BaseModel):
    call_id: str
    deleted_segments: int
    deleted_words: int
    deleted_calldata: bool
    semantic_removed: bool
    chunks_reset: int


# -------------------------
# Dependencies
# -------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# Routes
# -------------------------

@router.post("/{call_id}/run", response_model=PipelineRunResponse)
def run_pipeline(call_id: str, steps: Optional[PipelineStepsRequest] = None):
    """
    Run the end-to-end pipeline for a single call.
    """
    try:
        steps_dict: Optional[Dict[str, bool]] = (
            {k: v for k, v in (steps.dict() if steps else {}).items() if v is not None}
            if steps is not None
            else None
        )

        result: Dict[str, Any] = run_pipeline_for_call(call_id, steps=steps_dict)
        return PipelineRunResponse(**result)

    except Exception as exc:
        msg = str(exc)
        if "No row was found" in msg or "not present in table" in msg or "No Call" in msg:
            raise HTTPException(status_code=404, detail=f"Call '{call_id}' not found.")
        raise HTTPException(status_code=500, detail=f"Pipeline failed for call '{call_id}'.")


@router.post("/{call_id}/reset", response_model=PipelineResetResponse)
def reset_pipeline(call_id: str, db: Session = Depends(get_db)):
    """
    Reset a call to 'chunks only' state:
      - Deletes words, segments, and CallData
      - Lazily deletes from semantic store
      - Marks all chunks back to 'pending'
    """
    try:
        result = reset_call(db, call_id)
        return PipelineResetResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reset failed for call '{call_id}'.")
