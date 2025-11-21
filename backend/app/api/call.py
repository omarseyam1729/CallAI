from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pathlib import Path

from app.core.database import SessionLocal
from app.controllers.core import transcription_controller as tc
from app.core.database import SessionLocal
from app.models import CallData, AudioChunk, Segment
from app.schemas.call_data import CallDataResponse
from app.services.audio_splitter import extract_audio_snippet
import uuid

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

class SegmentResponse(BaseModel):
    id: int
    chunk_id: int
    speaker: str
    start: float
    end: float
    text: str | None
    sentiment_label: str | None = None
    sentiment_confidence: float | None = None
    emotion_label: str | None = None
    emotion_confidence: float | None = None

class SegmentsResponse(BaseModel):
    call_id: str
    segments: list[SegmentResponse]

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


@router.get("/transcription/{call_id}/segments", response_model=SegmentsResponse)
def get_segments(call_id: str):
    """
    Return all segments with timestamps and speaker information for a given call.
    """
    try:
        segments = tc.get_segments_by_call(call_id)
        return SegmentsResponse(
            call_id=call_id,
            segments=[SegmentResponse(**seg) for seg in segments]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/transcription/{call_id}/segments/{segment_id}/audio")
def get_segment_audio(call_id: str, segment_id: int, db: Session = Depends(get_db)):
    """
    Extract and return audio snippet for a specific segment.
    """
    try:
        # Get segment with chunk info
        segment = (
            db.query(Segment)
            .join(AudioChunk)
            .filter(Segment.id == segment_id)
            .filter(AudioChunk.call_id == call_id)
            .first()
        )
        
        if not segment:
            raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found for call {call_id}")
        
        chunk = segment.chunk
        if not Path(chunk.chunk_path).exists():
            raise HTTPException(status_code=404, detail=f"Audio chunk file not found: {chunk.chunk_path}")
        
        # Calculate absolute start time in chunk
        chunk_offset = chunk.start_time
        segment_start_absolute = segment.start
        segment_end_absolute = segment.end
        
        # Extract audio snippet
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        output_path = temp_dir / f"segment_{segment_id}_{uuid.uuid4().hex}.wav"
        
        extract_audio_snippet(
            chunk.chunk_path,
            segment.start,  # relative to chunk
            segment.end,    # relative to chunk
            str(output_path)
        )
        
        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Failed to extract audio snippet")
        
        return FileResponse(
            str(output_path),
            media_type="audio/wav",
            filename=f"segment_{segment_id}.wav"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting audio: {str(e)}")



