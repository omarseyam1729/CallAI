# app/controllers/transcription_controller.py

import logging
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload
from app.core.database import SessionLocal
from app.models import Call,AudioChunk, Segment, Word
from app.services.whisperx_transcribe import transcribe_with_whisperx
from collections import defaultdict
from sqlalchemy.orm import joinedload


logger = logging.getLogger(__name__)

def process_pending_chunks():

    """Fetch pending audio chunks, transcribe & diarize them, then populate DB tables."""
    db = SessionLocal()
    try:
        pending_chunks = (
            db.query(AudioChunk)
              .filter(AudioChunk.status == "pending")
              .all()
        )

        for chunk in pending_chunks:
            file_path = Path(chunk.chunk_path)
            if not file_path.exists():
                logger.error(f"Missing file for chunk {chunk.id}: {file_path}")
                chunk.status = "error"
                db.add(chunk)
                db.commit()
                continue

            logger.info(f"Processing chunk {chunk.id}: {file_path.name}")

            try:
                transcript_segments, diarization_segments = transcribe_with_whisperx(str(file_path))
            except Exception as ex:
                logger.exception(f"Transcription failed for chunk {chunk.id}")
                chunk.status = "error"
                db.add(chunk)
                db.commit()
                continue

            # helper to map a timestamp to a speaker label
            def get_speaker_for_time(t: float) -> str:
                for turn in diarization_segments:
                    if turn["start"] <= t <= turn["end"]:
                        return turn["speaker"]
                return "Unknown"

            
            segments_data = []
            for seg in transcript_segments:
                mid = (seg["start"] + seg["end"]) / 2
                speaker = get_speaker_for_time(mid)
                segments_data.append({
                    "speaker": speaker,
                    "start":   seg["start"],
                    "end":     seg["end"],
                    "text":    seg.get("text", ""),
                    "words": [
                        {
                            "word":       w["word"],
                            "start":      w["start"],
                            "end":        w["end"],
                            "confidence": w.get("score")
                        }
                        for w in seg.get("words", [])
                    ],
                })

            # persist segments + words
            for sd in segments_data:
                db_seg = Segment(
                    chunk_id=chunk.id,
                    speaker=sd["speaker"],
                    start=sd["start"],
                    end=sd["end"],
                    text=sd["text"],
                )
                db.add(db_seg)
                db.flush()  

                for w in sd["words"]:
                    db.add(Word(
                        segment_id=db_seg.id,
                        word=w["word"],
                        start=w["start"],
                        end=w["end"],
                        confidence=w["confidence"],
                    ))

          
            chunk.status = "done"
            db.add(chunk)
            db.commit()
            logger.info(f" Chunk {chunk.id} completed")

    except SQLAlchemyError:
        logger.exception("Database error during transcription run")
        db.rollback()
    finally:
        db.close()

def process_pending_chunks_for_call(call_id: str):
    """Fetch pending chunks for a given call, transcribe & diarize them, then populate DB."""
    
    db = SessionLocal()
    try:
        pending_chunks = (
            db.query(AudioChunk)
              .filter(
                  AudioChunk.status  == "pending",
                  AudioChunk.call_id == call_id
              )
              .all()
        )

        if not pending_chunks:
            logger.info(f"No pending chunks for call {call_id}")
            return

        for chunk in pending_chunks:
            file_path = Path(chunk.chunk_path)
            if not file_path.exists():
                logger.error(f"[Call {call_id}] missing file for chunk {chunk.id}")
                chunk.status = "error"
                db.add(chunk)
                db.commit()
                continue

            logger.info(f"[Call {call_id}] ⏳ Processing chunk {chunk.id}")
            try:
                transcript_segments, diarization_segments = transcribe_with_whisperx(str(file_path))
            except Exception:
                logger.exception(f"[Call {call_id}] transcription failed for chunk {chunk.id}")
                chunk.status = "error"
                db.add(chunk)
                db.commit()
                continue

            # same merge logic as before
            def get_speaker_for_time(t: float) -> str:
                for turn in diarization_segments:
                    if turn["start"] <= t <= turn["end"]:
                        return turn["speaker"]
                return "Unknown"

            segments_data = []
            for seg in transcript_segments:
                mid = (seg["start"] + seg["end"]) / 2
                speaker = get_speaker_for_time(mid)
                segments_data.append({
                    "speaker": speaker,
                    "start":   seg["start"],
                    "end":     seg["end"],
                    "text":    seg.get("text", ""),
                    "words": [
                        {
                            "word":       w["word"],
                            "start":      w["start"],
                            "end":        w["end"],
                            "confidence": w.get("score")
                        }
                        for w in seg.get("words", [])
                    ],
                })

            # persist segments + words
            for sd in segments_data:
                db_seg = Segment(
                    chunk_id=chunk.id,
                    speaker=sd["speaker"],
                    start=sd["start"],
                    end=sd["end"],
                    text=sd["text"]
                )
                db.add(db_seg)
                db.flush()

                for w in sd["words"]:
                    db.add(Word(
                        segment_id=db_seg.id,
                        word=w["word"],
                        start=w["start"],
                        end=w["end"],
                        confidence=w["confidence"]
                    ))

            chunk.status = "done"
            db.add(chunk)
            db.commit()
            logger.info(f"[Call {call_id}] ✅ Chunk {chunk.id} done")

    except SQLAlchemyError:
        logger.exception(f"[Call {call_id}] DB error during transcription")
        db.rollback()
    finally:
        db.close()

def reprocess_error_chunks():
    """
    Re-run transcription on all AudioChunk rows currently marked 'error'.
    Useful after you’ve fixed the underlying cause (e.g. missing file restored,
    WhisperX crash resolved, etc.).
    """
    db = SessionLocal()
    try:
        error_chunks = (
            db.query(AudioChunk)
              .filter(AudioChunk.status == "error")
              .all()
        )

        if not error_chunks:
            logger.info("No chunks in error state to re-process.")
            return

        for chunk in error_chunks:
            file_path = Path(chunk.chunk_path)
            if not file_path.exists():
                logger.error(f"[Retry] Still missing file for chunk {chunk.id}: {file_path}")
                # keep it 'error'; nothing we can do
                continue

            logger.info(f"[Retry] ⏳ Re-processing chunk {chunk.id}")

            try:
                transcript_segments, diarization_segments = transcribe_with_whisperx(str(file_path))
            except Exception:
                logger.exception(f"[Retry] Transcription failed again for chunk {chunk.id}")
                # leave status as 'error' so we can inspect later
                continue

            # --- merge diarization + transcript exactly like before ---
            def get_speaker_for_time(t: float) -> str:
                for turn in diarization_segments:
                    if turn["start"] <= t <= turn["end"]:
                        return turn["speaker"]
                return "Unknown"

            segments_data = []
            for seg in transcript_segments:
                mid = (seg["start"] + seg["end"]) / 2
                segments_data.append({
                    "speaker": get_speaker_for_time(mid),
                    "start":   seg["start"],
                    "end":     seg["end"],
                    "text":    seg.get("text", ""),
                    "words": [
                        {
                            "word":       w["word"],
                            "start":      w["start"],
                            "end":        w["end"],
                            "confidence": w.get("score"),
                        }
                        for w in seg.get("words", [])
                    ],
                })

            # --- clear any past partial rows for this chunk ---
            db.query(Word).filter(
                Word.segment_id.in_(
                    db.query(Segment.id).filter(Segment.chunk_id == chunk.id)
                )
            ).delete(synchronize_session=False)
            db.query(Segment).filter(Segment.chunk_id == chunk.id).delete(synchronize_session=False)
            db.flush()

            # --- insert fresh Segment + Word rows ---
            for sd in segments_data:
                db_seg = Segment(
                    chunk_id=chunk.id,
                    speaker=sd["speaker"],
                    start=sd["start"],
                    end=sd["end"],
                    text=sd["text"],
                )
                db.add(db_seg)
                db.flush()

                for w in sd["words"]:
                    db.add(
                        Word(
                            segment_id=db_seg.id,
                            word=w["word"],
                            start=w["start"],
                            end=w["end"],
                            confidence=w["confidence"],
                        )
                    )

            chunk.status = "done"
            db.add(chunk)
            db.commit()
            logger.info(f"[Retry] ✅ Chunk {chunk.id} now processed successfully")

    except SQLAlchemyError:
        logger.exception("DB error during error-chunk reprocessing")
        db.rollback()
    finally:
        db.close()

def get_full_transcription(call_uuid: str) -> str:
    db = SessionLocal()
    try:
        # load call by UUID → chunks → segments
        call = (
            db.query(Call)
              .options(
                  selectinload(Call.chunks)
                  .selectinload(AudioChunk.segments)
              )
              .filter(Call.id == call_uuid)
              .first()
        )

        if not call:
            raise ValueError(f"Call {call_uuid} not found")

        # collect and order segment texts
        segments_text = []
        for chunk in sorted(call.chunks, key=lambda c: c.start_time):
            for seg in sorted(chunk.segments, key=lambda s: s.start):
                if seg.text:
                    segments_text.append(seg.text.strip())

        # merge all segment texts into one transcript
        return " ".join(segments_text).strip()

    finally:
        db.close()


def get_chunk_transcription(chunk_id: int) -> str:
    db = SessionLocal()
    try:
        # load a single chunk → segments
        chunk = (
            db.query(AudioChunk)
              .options(
                  selectinload(AudioChunk.segments)
              )
              .filter(AudioChunk.id == chunk_id)
              .first()
        )

        if not chunk:
            raise ValueError(f"Call {chunk_id} not found")

        # collect and order segment texts for this chunk
        segments_text = []
        for seg in sorted(chunk.segments, key=lambda s: s.start):
            if seg.text:
                segments_text.append(seg.text.strip())

        return " ".join(segments_text).strip()

    finally:
        db.close()



def get_speaker_transcript_by_call(call_id: str) -> dict[str, str]:
    """
    Returns a dictionary with speaker labels as keys and their concatenated
    utterances as values for a given call_id.
    """
    db = SessionLocal()
    try:
        call = (
            db.query(Call)
            .filter(Call.id == call_id)
            .options(
                joinedload(Call.chunks).joinedload(AudioChunk.segments)  # ✅ fixed
            )
            .first()
        )

        if not call:
            return {"error": f"Call with ID {call_id} not found."}

        speaker_map = defaultdict(list)

        # Iterate through sorted chunks and their segments
        for chunk in sorted(call.chunks, key=lambda c: c.start_time):
            for seg in sorted(chunk.segments, key=lambda s: s.start):
                if seg.text and seg.speaker:
                    speaker_map[seg.speaker].append(seg.text.strip())

        return {speaker: " ".join(texts) for speaker, texts in speaker_map.items()}

    finally:
        db.close()


def get_segments_by_call(call_id: str) -> list[dict]:
    """
    Returns a list of segments with timestamps, speaker, and text for a given call_id.
    Segments are sorted by their start time across all chunks.
    """
    db = SessionLocal()
    try:
        call = (
            db.query(Call)
            .filter(Call.id == call_id)
            .options(
                joinedload(Call.chunks).joinedload(AudioChunk.segments)
            )
            .first()
        )

        if not call:
            raise ValueError(f"Call with ID {call_id} not found.")

        segments_list = []
        
        # Iterate through sorted chunks and their segments
        for chunk in sorted(call.chunks, key=lambda c: c.start_time):
            chunk_offset = chunk.start_time  # offset for absolute time
            for seg in sorted(chunk.segments, key=lambda s: s.start):
                segments_list.append({
                    "id": seg.id,
                    "chunk_id": chunk.id,
                    "speaker": seg.speaker,
                    "start": chunk_offset + seg.start,  # absolute time
                    "end": chunk_offset + seg.end,  # absolute time
                    "text": seg.text,
                    "sentiment_label": seg.sentiment_label,
                    "sentiment_confidence": seg.sentiment_confidence,
                    "emotion_label": seg.emotion_label,
                    "emotion_confidence": seg.emotion_confidence,
                })

        return segments_list

    finally:
        db.close()



if __name__ == "__main__":
    print("hello")
    logging.basicConfig(level=logging.INFO)
    process_pending_chunks()
    
