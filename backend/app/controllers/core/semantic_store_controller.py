# app/controllers/call_search_controller.py

from typing import List, Dict
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import Call
from app.services.semantic_store import store


def search_calls_by_keyword(query: str, top_k: int = 10) -> List[Dict]:
    """
    Search for segments semantically similar to the query,
    then return grouped calls with their matching segments.

    Args:
        query (str): Search keyword or phrase.
        top_k (int): Max number of segments to consider.

    Returns:
        List of dicts with:
        - call_id
        - filename
        - segments: list of matching segments
    """
    # Step 1: Run semantic search
    results = store.search_with_call_and_duration(query, top_k=top_k)

    if not results:
        return []

    # Step 2: Group segments by call_id
    calls_dict: Dict[str, Dict] = {}

    for seg in results:
        call_id = seg["call_id"]
        if call_id not in calls_dict:
            calls_dict[call_id] = {
                "call_id": call_id,
                "filename": None,       # to be filled from DB
                "segments": []
            }

        calls_dict[call_id]["segments"].append({
            "segment_id": seg["segment_id"],
            "text": seg["text"],
            "speaker": seg["speaker"],
            "start": seg["start"],
            "end": seg["end"],
            "duration": seg["duration"],
            "score": seg["score"]
        })

    # Step 3: Query DB to get filenames for each call
    db: Session = SessionLocal()
    try:
        for call in db.query(Call).filter(Call.id.in_(calls_dict.keys())).all():
            calls_dict[call.id]["filename"] = call.filename
    finally:
        db.close()

    return list(calls_dict.values())


if __name__=="__main__":
    print(search_calls_by_keyword("hello",5))