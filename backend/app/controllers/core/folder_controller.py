import os
import shutil
import uuid
from pathlib import Path

from app.services.audio_splitter import split_audio_ffmpeg
from app.core.database import SessionLocal
from app.models import Call, AudioChunk

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)


def parse_start_end_from_path(path: str) -> tuple[float, float]:
    """
    Extracts start and end time from chunk filename.
    Example: chunk_1_25_51.wav → (25.0, 51.0)
    """
    filename = Path(path).name  # chunk_1_25_51.wav
    parts = filename.replace(".wav", "").split("_")  # ['chunk', '1', '25', '51']
    start = float(parts[2])
    end = float(parts[3])
    return start, end


def handle_audio_upload_and_split(source_path: str) -> dict:
    call_id = str(uuid.uuid4())
    call_folder = MEDIA_DIR / f"call_{call_id}"
    call_folder.mkdir(parents=True, exist_ok=True)

    ext = Path(source_path).suffix
    target_path = call_folder / f"original{ext}"
    shutil.copy(source_path, target_path)

    # Get chunk paths from FFmpeg splitter
    chunk_paths = split_audio_ffmpeg(str(target_path))  # list of strings
    print("Chunk paths:", chunk_paths)

    db = SessionLocal()
    try:
        # Create Call record
        call_entry = Call(
            id=call_id,
            filename=target_path.name,
            folder_path=str(call_folder),
        )
        db.add(call_entry)
        db.commit()

        chunk_entries = []
        for path in chunk_paths:
            start, end = parse_start_end_from_path(path)
            chunk_entries.append(AudioChunk(
                call_id=call_id,
                chunk_path=path,
                start_time=start,
                end_time=end,
                status="pending"
            ))

        db.bulk_save_objects(chunk_entries)
        db.commit()
    finally:
        db.close()
    
    return {
        "call_id": call_id,
        "original_path": str(target_path),
        "chunk_paths": chunk_paths
    }



if __name__ == "__main__":
    info = handle_audio_upload_and_split("example.mp3")
    print("Upload Info:")
    print(info)
