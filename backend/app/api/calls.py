# app/routes/calls.py
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
# in app/routes/calls.py
from app.controllers.metrics.call_metrics import get_advanced_metrics_controller, AdvancedMetricsOut
from app.controllers.core.call_controller import (
    list_calls_controller,
    get_call_controller,
    update_call_controller,
    PaginatedCallsResponse,
    CallDetailOut,
    CallUpdateIn,
)

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
# Routes
# -------------------------

@router.get("", response_model=PaginatedCallsResponse)
def list_calls(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="1-based page number"),
    per_page: int = Query(25, ge=1, le=100, description="Items per page (max 100)"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort by upload_time"),
    q: Optional[str] = Query(None, description="Search in call_name / call_description (case-insensitive)"),
    date_from: Optional[datetime] = Query(None, description="Include calls uploaded on/after this datetime (inclusive)"),
    date_to: Optional[datetime] = Query(None, description="Include calls uploaded before this datetime (exclusive)"),
    agent_name: Optional[str] = Query(None, description="Filter by Agent.name (partial, case-insensitive)"),
    agent_id: Optional[int] = Query(None, description="Filter by Agent.id (exact)"),
):
    return list_calls_controller(
        db=db,
        page=page,
        per_page=per_page,
        order=order,
        q=q,
        date_from=date_from,
        date_to=date_to,
        agent_name=agent_name,
        agent_id=agent_id,
    )


@router.get("/{call_id}", response_model=CallDetailOut)
def get_call(call_id: str, db: Session = Depends(get_db)):
    try:
        return get_call_controller(db, call_id)
    except ValueError as e:
        if str(e) == "CALL_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Call not found")
        raise


@router.patch("/{call_id}", response_model=CallDetailOut)
def patch_call(call_id: str, payload: CallUpdateIn, db: Session = Depends(get_db)):
    """
    Partially update call metadata.
    - call_name: str | null (null clears it)
    - call_description: str | null (null clears it)
    - agent_id: int | null (null unsets agent)
    """
    try:
        return update_call_controller(db, call_id, payload)
    except ValueError as e:
        msg = str(e)
        if msg == "CALL_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Call not found")
        if msg == "AGENT_NOT_FOUND":
            raise HTTPException(status_code=400, detail="Agent not found")
        raise




@router.get("/{call_id}/metrics", response_model=AdvancedMetricsOut)
def get_advanced_metrics(call_id: str, db: Session = Depends(get_db)):
    try:
        return get_advanced_metrics_controller(db, call_id)
    except ValueError as e:
        if str(e) == "CALL_NOT_FOUND":
            raise HTTPException(status_code=404, detail="Call not found")
        raise
