from app.core.database import SessionLocal
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from app.models import Call, AudioChunk, Segment, Word



def search_in_call(call_id: str, query: str) -> list[dict]:
    db = SessionLocal()
    try:
        call = (
            db.query(Call)
            .filter(Call.id == call_id)
            .options(joinedload(Call.chunks).joinedload(AudioChunk.segments))
            .first()
        )

        if not call:
            return [{"error": f"Call ID {call_id} not found."}]

        matches = []
        query_lower = query.lower()

        for chunk in call.chunks:
            for seg in chunk.segments:
                if seg.text and query_lower in seg.text.lower():
                    absolute_time = chunk.start_time + seg.start
                    matches.append({
                        "text": seg.text.strip(),
                        "speaker": seg.speaker,
                        "chunk_id": chunk.id,
                        "segment_id": seg.id,
                        "start_time": round(absolute_time, 3),
                        "relative_segment_start": seg.start
                    })

        return matches

    finally:
        db.close()



    """
    Returns the total duration (in seconds) of the call with the given call_id.
    """
    db = SessionLocal()
    try:
        result = (
            db.query(func.max(AudioChunk.start_time + AudioChunk.end_time))
            .join(Call.chunks)
            .filter(Call.id == call_id)
            .scalar()
        )

        if result is None:
            return 0.0

        return round(result, 2)

    finally:
        db.close()


def rank_calls_by_word_count(limit: int = 20) -> list[dict]:

    """
    Returns a list of calls ranked by total word count, descending.
    """
    db = SessionLocal()
    try:
        results = (
            db.query(Call.id, Call.filename, func.count(Word.id).label("word_count"))
            .join(Call.chunks)
            .join(AudioChunk.segments)
            .join(Segment.words)
            .group_by(Call.id, Call.filename)
            .order_by(func.count(Word.id).desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "call_id": call_id,
                "word_count": word_count
            }
            for call_id, filename, word_count in results
        ]

    finally:
        db.close()





if __name__=="__main__":
    results = search_in_call("ae50f10d-1afe-44e8-8f1e-d23be697ce6c","Randall")
    print(results)

