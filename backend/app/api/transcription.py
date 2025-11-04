from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.models import CallData
from app.controllers import transcription_controller as tc

router = APIRouter()

# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Response Models
# -------------------------
class TranscriptResponse(BaseModel):
    call_id: str
    transcript: str

class SpeakerTranscriptResponse(BaseModel):
    call_id: str
    speakers: dict[str, str]

class CallDataResponse(BaseModel):
    call_id: str
    full_transcript: str | None
    llm_summary: str | None
    sentiment_label: str | None
    sentiment_confidence: float | None
    emotion_label: str | None
    emotion_confidence: float | None

# -------------------------
# Routes
# -------------------------

@router.get("/transcription/{call_id}", response_model=TranscriptResponse)
def get_transcription(call_id: str):
    """
    Return the full merged transcription for a given call.
    """
    try:
        text = tc.get_full_transcription(call_id)
        return TranscriptResponse(call_id=call_id, transcript=text)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/transcription/{call_id}/speakers", response_model=SpeakerTranscriptResponse)
def get_transcription_by_speaker(call_id: str):
    """
    Return transcript grouped by speaker for a given call.
    """
    data = tc.get_speaker_transcript_by_call(call_id)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return SpeakerTranscriptResponse(call_id=call_id, speakers=data)


@router.get("/transcription/{call_id}/data", response_model=CallDataResponse)
def get_call_data(call_id: str, db: Session = Depends(get_db)):
    """
    Fetch analysis data (transcript, summary, sentiment, emotion) for a call.
    """
    cd = db.query(CallData).filter(CallData.call_id == call_id).one_or_none()
    if not cd:
        raise HTTPException(status_code=404, detail=f"CallData not found for call {call_id}")

    return CallDataResponse(
        call_id=call_id,
        full_transcript=cd.full_transcript,
        llm_summary=cd.llm_summary,
        sentiment_label=cd.sentiment_label,
        sentiment_confidence=cd.sentiment_confidence,
        emotion_label=cd.emotion_label,
        emotion_confidence=cd.emotion_confidence,
    )
