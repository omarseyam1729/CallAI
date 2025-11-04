

from pathlib import Path
import tempfile
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from sqlalchemy.orm import joinedload

from app.controllers.core.folder_controller import handle_audio_upload_and_split
from app.schemas import CallSchema
from app.core.database import SessionLocal
from app.models import Call, AudioChunk, Segment, Word

router = APIRouter()


@router.post(
    "/",
    response_model=CallSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an audio file, split it, and return the Call record",
)
async def upload_audio(file: UploadFile = File(...)):
    # 1. Persist the incoming file to a temp file
    suffix = Path(file.filename).suffix or ".bin"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save upload: {e}"
        )

    
    try:
        result = handle_audio_upload_and_split(tmp_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing audio: {e}"
        )

    db = SessionLocal()
    try:
        call = (
            db.query(Call)
            .options(
                joinedload(Call.chunks)
                  .joinedload(AudioChunk.segments)
                  .joinedload(Segment.words)
            )
            .filter(Call.id == result["call_id"])
            .one()
        )
    finally:
        db.close()

    return call


