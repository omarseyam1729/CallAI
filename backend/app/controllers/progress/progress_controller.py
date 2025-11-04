# app/controllers/progress_controller.py
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import AudioChunk

logger = logging.getLogger(__name__)

def get_call_progress(db: Session, call_id: str) -> Dict[str, Any]:
    """
    Returns total chunks, done chunks, error chunks, pending chunks,
    and a percentage (0..100) of done chunks for a given call_id.
    """
    # Single round-trip aggregation: total, done, pending, error
    done_case = case((AudioChunk.status == "done", 1), else_=0)
    pending_case = case((AudioChunk.status == "pending", 1), else_=0)
    error_case = case((AudioChunk.status == "error", 1), else_=0)

    total, done_cnt, pending_cnt, error_cnt = (
        db.query(
            func.count(AudioChunk.id),
            func.coalesce(func.sum(done_case), 0),
            func.coalesce(func.sum(pending_case), 0),
            func.coalesce(func.sum(error_case), 0),
        )
        .filter(AudioChunk.call_id == call_id)
        .one()
    )

    if total == 0:
        # No chunks yet: return zeros to avoid div-by-zero
        return {
            "call_id": call_id,
            "total_chunks": 0,
            "done_chunks": 0,
            "pending_chunks": 0,
            "error_chunks": 0,
            "progress_percent": 0.0,
        }

    progress = (done_cnt / total) * 100.0
    return {
        "call_id": call_id,
        "total_chunks": int(total),
        "done_chunks": int(done_cnt),
        "pending_chunks": int(pending_cnt),
        "error_chunks": int(error_cnt),
        "progress_percent": round(progress, 2),
    }
