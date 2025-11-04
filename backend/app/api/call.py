from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.controllers.core import transcription_controller as tc
from app.core.database import SessionLocal
from app.models import CallData
from app.schemas.call_data import CallDataResponse

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

@router.get("/{call_id}/data", response_model=CallDataResponse)
def get_call_data(call_id: str, db: Session = Depends(get_db)):
    """
    Return the CallData row for a given call_id.
    """
    call_data = db.query(CallData).filter(CallData.call_id == call_id).first()
    if not call_data:
        raise HTTPException(
            status_code=404,
            detail=f"No CallData found for call_id={call_id}"
        )
    return call_data



