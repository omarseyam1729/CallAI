# app/controllers/pipeline_controller.py
from typing import Dict, Any, List
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import exists

from app.core.database import SessionLocal
from app.models import Call, CallData, Segment, AudioChunk, Word
from app.controllers.core.transcription_controller import (
    process_pending_chunks_for_call,
    get_full_transcription,
)
from app.controllers.core.ollama_controller import summarise_with_callAI
from app.controllers.core.sentiment_controller import (
    populate_segment_emotions_and_sentiments,
    get_most_occuring_sentiment,
    get_most_occuring_emotion,         
)
from app.services.semantic_store import store

logger = logging.getLogger(__name__)


 # make sure Word is imported


def reset_call(db: Session, call_id: str) -> Dict[str, Any]:
    """
    Reset a call to 'chunks only' state:
      - Deletes all Words for Segments belonging to the call
      - Deletes all Segments for the call
      - Deletes CallData row for the call
      - Lazily deletes the call from the semantic store (metadata only)
      - Marks all AudioChunks for this call as 'pending'
    Leaves Call untouched.
    """
    try:
        # 1) Find all chunk ids for this call
        chunks = db.query(AudioChunk).filter(AudioChunk.call_id == call_id).all()
        chunk_ids = [c.id for c in chunks]

        if not chunk_ids:
            return {
                "call_id": call_id,
                "deleted_segments": 0,
                "deleted_words": 0,
                "deleted_calldata": False,
                "semantic_removed": False,
                "chunks_reset": 0,
                "message": "No chunks found"
            }

        # 2) Find segment ids
        seg_ids = [sid for (sid,) in db.query(Segment.id).filter(Segment.chunk_id.in_(chunk_ids)).all()]

        # 3) Delete Words
        deleted_words = 0
        if seg_ids:
            deleted_words = db.query(Word).filter(Word.segment_id.in_(seg_ids)).delete(synchronize_session=False)

        # 4) Delete Segments
        deleted_segments = db.query(Segment).filter(Segment.id.in_(seg_ids)).delete(synchronize_session=False)

        # 5) Delete CallData row
        deleted_calldata = db.query(CallData).filter(CallData.call_id == call_id).delete(synchronize_session=False)

        # 6) Reset chunk statuses to "pending"
        chunks_reset = 0
        for chunk in chunks:
            chunk.status = "pending"
            db.add(chunk)
            chunks_reset += 1

        # 7) Lazy delete from semantic store (metadata only)
        semantic_removed = False
        try:
            removed = store.delete_call(call_id)
            semantic_removed = removed > 0
        except Exception as ex:
            logger.warning(f"[pipeline] semantic store lazy delete failed for call {call_id}: {ex}")

        db.commit()
        return {
            "call_id": call_id,
            "deleted_segments": deleted_segments,
            "deleted_words": deleted_words,
            "deleted_calldata": bool(deleted_calldata),
            "semantic_removed": semantic_removed,
            "chunks_reset": chunks_reset,
        }

    except Exception:
        db.rollback()
        logger.exception(f"[pipeline] reset failed for call {call_id}")
        raise


def _has_segments(db: Session, call_id: str) -> bool:
    return db.query(
        exists().where(
            Segment.chunk_id.in_(
                db.query(AudioChunk.id).filter(AudioChunk.call_id == call_id)
            )
        )
    ).scalar()


def _get_or_create_calldata(db: Session, call_id: str) -> CallData:
    cd = db.query(CallData).filter(CallData.call_id == call_id).one_or_none()
    if cd:
        return cd
    cd = CallData(call_id=call_id)
    db.add(cd)
    db.flush()
    return cd


def run_pipeline_for_call(call_id: str, steps: Dict[str, bool] | None = None) -> Dict[str, Any]:
    """
    End-to-end pipeline for a single call.
    Steps default to all True. Keep each step idempotent.

    Also writes overall sentiment/emotion for the call into CallData,
    computed from the LLM summary.
    """
    steps = steps or {"transcription": True, "summary": True, "sentiment": True, "semantic": True}

    db: Session = SessionLocal()
    transcript_text = None
    summary_text = None

    try:
        _ = db.query(Call).filter(Call.id == call_id).one()

        # 1) TRANSCRIPTION
        if steps.get("transcription", True):
            if not _has_segments(db, call_id):
                logger.info(f"[pipeline] No segments for call {call_id}; running WhisperX…")
                process_pending_chunks_for_call(call_id)
            else:
                logger.info(f"[pipeline] Segments already exist for call {call_id}; skipping transcription.")

        # 2) FULL TRANSCRIPT + 3) LLM SUMMARY (and store in CallData)
        cd = None
        if steps.get("summary", True):
            transcript_text = get_full_transcription(call_id)
            summary_text = summarise_with_callAI(call_id)
            cd = _get_or_create_calldata(db, call_id)
            cd.full_transcript = transcript_text
            cd.llm_summary = summary_text
            db.add(cd)

        # 4) SENTIMENT + EMOTION PER SEGMENT
        if steps.get("sentiment", True):
            # per-segment labels
            populate_segment_emotions_and_sentiments(call_id, db)

            # compute overall from segment modes first
            cd = cd or _get_or_create_calldata(db, call_id)

            mode_sent = get_most_occuring_sentiment(call_id, db)   # returns label or None
            mode_emo  = get_most_occuring_emotion(call_id, db)     # returns label or None

            # If segment modes exist, use them
            if mode_sent:
                cd.sentiment_label = mode_sent
                cd.sentiment_confidence = None   # no confidence from "mode"; leave None or store a count if you add one later
            if mode_emo:
                cd.emotion_label = mode_emo
                cd.emotion_confidence = None     # same note as above

            # Fallback to LLM summary only if a mode wasn't available
            needs_sentiment = cd.sentiment_label is None
            needs_emotion   = cd.emotion_label is None

        # 5) SEMANTIC STORE UPDATE
        if steps.get("semantic", True):
            try:
                store.update_with_call(call_id)
            except Exception as ex:
                logger.exception(f"[pipeline] Semantic store update failed for call {call_id}: {ex}")

        db.commit()

        return {
            "call_id": call_id,
            "steps_run": [k for k, v in steps.items() if v],
            "transcript_len": len(transcript_text or ""),
            "summary_len": len(summary_text or ""),
        }

    except Exception:
        db.rollback()
        logger.exception(f"[pipeline] run failed for call {call_id}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    """
    Run:
      python -m app.controllers.pipeline_controller <CALL_ID> [--reset] [--no-transcribe] [--no-summary] [--no-sentiment] [--no-semantic]

    Examples:
      # Run full pipeline
      python -m app.controllers.pipeline_controller 40594f20-b098-4346-a7e6-fe4e32c61ec0

      # Reset call (delete segments, words, calldata, semantic store)
      python -m app.controllers.pipeline_controller 40594f20-b098-4346-a7e6-fe4e32c61ec0 --reset

      # Skip semantic step
      python -m app.controllers.pipeline_controller 40594f20-b098-4346-a7e6-fe4e32c61ec0 --no-semantic
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m app.controllers.pipeline_controller <CALL_ID> [--reset] [--no-transcribe] [--no-summary] [--no-sentiment] [--no-semantic]")
        sys.exit(1)

    call_id = sys.argv[1]
    flags = {arg for arg in sys.argv[2:] if arg.startswith("--")}

    if "--reset" in flags:
        db = SessionLocal()
        try:
            out = reset_call(db, call_id)
            print(json.dumps({"action": "reset", **out}, indent=2))
        finally:
            db.close()
        sys.exit(0)

    steps = {
        "transcription": "--no-transcribe" not in flags,
        "summary": "--no-summary" not in flags,
        "sentiment": "--no-sentiment" not in flags,
        "semantic": "--no-semantic" not in flags,
    }

    out = run_pipeline_for_call(call_id, steps=steps)
    print(json.dumps(out, indent=2))

