# app/api/search.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.schemas.search import (
    KeywordSearchRequest, SemanticSearchRequest, SearchResult
)
from app.models import Segment, AudioChunk
from app.services.semantic_store import store  

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/keyword", response_model=list[SearchResult])
def keyword_search(req: KeywordSearchRequest, db: Session = Depends(get_db)):
    q = (
        db.query(Segment, AudioChunk.call_id)
        .join(AudioChunk, Segment.chunk_id == AudioChunk.id)
        .filter(Segment.text.ilike(f"%{req.query}%"))
    )
    if req.call_id:
        q = q.filter(AudioChunk.call_id == req.call_id)

    results = []
    for seg, call_id in q.limit(req.top_k).all():
        results.append(SearchResult(
            segment_id=seg.id,
            call_id=str(call_id),
            text=seg.text,
            speaker=seg.speaker,
            start=seg.start,
            end=seg.end,
            duration=seg.end - seg.start,
            score=1.0  # dummy for keyword search
        ))
    return results

@router.post("/semantic", response_model=list[SearchResult])
def semantic_search(req: SemanticSearchRequest):
    try:
        print("hello world")
        results = store.search_with_call_and_duration(req.query, top_k=req.top_k)
        
        return [SearchResult(**r) for r in results]
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
