

from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Call,
    CallData,
    AudioChunk,
    Segment,
    Word,
    TriggerEval,
    Trigger,
)

# =========================
# Schemas
# =========================

class TriggerEvalOut(BaseModel):
    trigger_id: int
    trigger_name: str
    trigger_type: str
    matched: bool
    score: Optional[str] = None
    evidence: Optional[dict] = None
    evaluated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdvancedMetricsOut(BaseModel):
    # Call basics
    call_id: str
    upload_time: datetime
    call_name: Optional[str] = None
    call_description: Optional[str] = None
    llm_summary: Optional[str] = None
    agent_id: Optional[int] = None            # <-- added

    # Duration & counts
    duration_sec: float
    chunk_count: int
    segment_count: int
    word_count: int

    # Distributions
    speaker_counts: Dict[str, int]
    emotion_counts: Dict[str, int]
    sentiment_counts: Dict[str, int]

    # Trigger analytics
    matched_trigger_count: int
    last_trigger_eval_at: Optional[datetime] = None
    trigger_evals: List[TriggerEvalOut]

    model_config = ConfigDict(from_attributes=True)


# =========================
# Controller
# =========================

def get_advanced_metrics_controller(db: Session, call_id: str) -> AdvancedMetricsOut:
    call = db.query(Call).filter(Call.id == call_id).one_or_none()
    if not call:
        raise ValueError("CALL_NOT_FOUND")

    cdata = db.query(CallData).filter(CallData.call_id == call_id).one_or_none()

    # duration & chunk count
    duration_sec, chunk_count = db.query(
        func.coalesce(func.max(AudioChunk.end_time), 0.0),
        func.count(AudioChunk.id),
    ).filter(AudioChunk.call_id == call_id).one()

    # segment count
    segment_count = (
        db.query(func.count(Segment.id))
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(AudioChunk.call_id == call_id)
        .scalar()
        or 0
    )

    # word count
    word_count = (
        db.query(func.count(Word.id))
        .join(Segment, Word.segment_id == Segment.id)
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(AudioChunk.call_id == call_id)
        .scalar()
        or 0
    )

    # speaker counts
    speaker_rows = (
        db.query(Segment.speaker, func.count(Segment.id))
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(AudioChunk.call_id == call_id)
        .group_by(Segment.speaker)
        .all()
    )
    speaker_counts = {spk or "unknown": int(cnt) for spk, cnt in speaker_rows}

    # emotion counts (null-safe, lowercased)
    emotion_rows = (
        db.query(
            func.lower(func.coalesce(Segment.emotion_label, "unknown")),
            func.count(Segment.id),
        )
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(AudioChunk.call_id == call_id)
        .group_by(func.lower(func.coalesce(Segment.emotion_label, "unknown")))
        .all()
    )
    emotion_counts = {lbl: int(cnt) for lbl, cnt in emotion_rows}

    # sentiment counts (null-safe, lowercased)
    sentiment_rows = (
        db.query(
            func.lower(func.coalesce(Segment.sentiment_label, "unknown")),
            func.count(Segment.id),
        )
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(AudioChunk.call_id == call_id)
        .group_by(func.lower(func.coalesce(Segment.sentiment_label, "unknown")))
        .all()
    )
    sentiment_counts = {lbl: int(cnt) for lbl, cnt in sentiment_rows}

    # trigger evals
    eval_rows = (
        db.query(
            TriggerEval.trigger_id,
            Trigger.name.label("trigger_name"),
            Trigger.type.label("trigger_type"),
            TriggerEval.matched,
            TriggerEval.score,
            TriggerEval.evidence,
            TriggerEval.evaluated_at,
        )
        .join(Trigger, Trigger.id == TriggerEval.trigger_id)
        .filter(TriggerEval.call_id == call_id)
        .order_by(TriggerEval.evaluated_at.desc())
        .all()
    )

    trigger_evals: List[TriggerEvalOut] = [
        TriggerEvalOut(
            trigger_id=row.trigger_id,
            trigger_name=row.trigger_name,
            trigger_type=row.trigger_type,
            matched=bool(row.matched),
            score=row.score,
            evidence=row.evidence,
            evaluated_at=row.evaluated_at,
        )
        for row in eval_rows
    ]
    matched_trigger_count = sum(1 for e in trigger_evals if e.matched)
    last_trigger_eval_at = trigger_evals[0].evaluated_at if trigger_evals else None

    return AdvancedMetricsOut(
        call_id=call.id,
        upload_time=call.upload_time,
        call_name=cdata.call_name if cdata else None,
        call_description=cdata.call_description if cdata else None,
        llm_summary=cdata.llm_summary if cdata else None,
        agent_id=cdata.agent_id if cdata else None,       # <-- populated

        duration_sec=float(duration_sec or 0.0),
        chunk_count=int(chunk_count or 0),
        segment_count=int(segment_count or 0),
        word_count=int(word_count or 0),

        speaker_counts=speaker_counts,
        emotion_counts=emotion_counts,
        sentiment_counts=sentiment_counts,

        matched_trigger_count=matched_trigger_count,
        last_trigger_eval_at=last_trigger_eval_at,
        trigger_evals=trigger_evals,
    )
