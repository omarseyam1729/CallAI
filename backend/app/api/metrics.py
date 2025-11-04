from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.core.database import SessionLocal
from app.models import Call, Word, Segment, AudioChunk, Trigger, TriggerEval
from app.schemas.metrics import OverviewMetrics

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=OverviewMetrics)
def get_overview(db: Session = Depends(get_db)):
    """
    Return simple system-wide metrics for the dashboard.
    """
    # Totals
    total_words = db.query(func.count(Word.id)).scalar() or 0
    total_calls = db.query(func.count(Call.id)).scalar() or 0
    total_segments = db.query(func.count(Segment.id)).scalar() or 0
    total_chunks = db.query(func.count(AudioChunk.id)).scalar() or 0
    total_duration_sec = total_chunks * 30

    completed_chunks = (
        db.query(func.count(AudioChunk.id))
        .filter(AudioChunk.status == "done")
        .scalar()
        or 0
    )

    pending_chunks = (
        db.query(func.count(AudioChunk.id))
        .filter(AudioChunk.status == "pending")
        .scalar()
        or 0
    )

    # Sentiments grouped
    sentiment_rows = (
        db.query(Segment.sentiment_label, func.count(Segment.id))
        .group_by(Segment.sentiment_label)
        .all()
    )
    sentiments = {label or "unknown": cnt for label, cnt in sentiment_rows}

    # Emotions grouped
    emotion_rows = (
        db.query(Segment.emotion_label, func.count(Segment.id))
        .group_by(Segment.emotion_label)
        .all()
    )
    emotions = {label or "unknown": cnt for label, cnt in emotion_rows}

    # Trigger metrics
    total_triggers = db.query(func.count(Trigger.id)).scalar() or 0
    total_trigger_evals = db.query(func.count(TriggerEval.id)).scalar() or 0
    triggers_matched = (
        db.query(func.count(TriggerEval.id))
        .filter(TriggerEval.matched.is_(True))
        .scalar()
        or 0
    )
    triggers_unmatched = max(0, total_trigger_evals - triggers_matched)

    return OverviewMetrics(
        total_words=total_words,
        total_calls=total_calls,
        total_segments=total_segments,
        total_duration_sec=total_duration_sec,
        completed_chunks=completed_chunks,
        pending_chunks=pending_chunks,  
        sentiments=sentiments,
        emotions=emotions,
        total_triggers=total_triggers,
        total_trigger_evals=total_trigger_evals,
        triggers_matched=triggers_matched,
        triggers_unmatched=triggers_unmatched,
        generated_at=datetime.utcnow(),
    )
