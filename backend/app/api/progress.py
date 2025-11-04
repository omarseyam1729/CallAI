# app/routes/progress.py
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.controllers.progress.progress_controller import get_call_progress

router = APIRouter()

# -------------------------
# DB Session Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Response Model
# -------------------------
class ProgressResponse(BaseModel):
    call_id: str
    total_chunks: int
    done_chunks: int
    pending_chunks: int
    error_chunks: int
    progress_percent: float

# -------------------------
# Snapshot Endpoint
# -------------------------
@router.get("/progress/{call_id}", response_model=ProgressResponse)
def read_call_progress(call_id: str, db: Session = Depends(get_db)):
    """
    Return a one-time snapshot of call progress.
    Useful for polling or initial state check.
    """
    data = get_call_progress(db, call_id)
    if not data:
        raise HTTPException(status_code=404, detail="Call not found")
    return data

# -------------------------
# Streaming Endpoint (SSE)
# -------------------------
@router.get("/progress/{call_id}/stream")
async def stream_call_progress(call_id: str, db: Session = Depends(get_db)):
    """
    Stream progress updates for a given call using Server-Sent Events (SSE).
    - If the call is already complete, send one snapshot and close immediately.
    - If still pending, stream updates until all chunks are processed.
    """

    async def event_generator():
        last_progress = None
        while True:
            progress = get_call_progress(db, call_id)

            if not progress:
                # if call_id not found in DB
                yield f"event: error\ndata: {json.dumps({'detail': 'Call not found'})}\n\n"
                break

            # If already complete, send one snapshot and break immediately
            if progress["pending_chunks"] == 0:
                yield f"data: {json.dumps(progress)}\n\n"
                break

            # Yield only if progress has changed
            if progress != last_progress:
                yield f"data: {json.dumps(progress)}\n\n"
                last_progress = progress

            await asyncio.sleep(10)  # check every 10 seconds

    return StreamingResponse(event_generator(), media_type="text/event-stream")
