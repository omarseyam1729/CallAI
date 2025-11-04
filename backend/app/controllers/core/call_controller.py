# app/controllers/call_controller.py

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from app.models import Call, CallData, AudioChunk, Agent


# =========================
# Schemas (Pydantic v2)
# =========================

class CallOut(BaseModel):
    id: str
    call_name: Optional[str] = None
    call_description: Optional[str] = None
    upload_time: datetime
    duration_sec: float
    agent_id: Optional[int] = None
    agent_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PaginatedCallsResponse(BaseModel):
    page: int
    per_page: int
    total: int
    page_count: int
    next_page: Optional[int] = None
    prev_page: Optional[int] = None
    items: List[CallOut]


class CallDetailOut(BaseModel):
    id: str
    upload_time: datetime
    call_name: Optional[str] = None
    call_description: Optional[str] = None
    agent_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class CallUpdateIn(BaseModel):
    # Use Optional[Optional[T]] to allow omitting vs explicitly clearing with null
    call_name: Optional[Optional[str]] = None
    call_description: Optional[Optional[str]] = None
    agent_id: Optional[Optional[int]] = None

    @field_validator("call_name", "call_description", mode="before")
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# =========================
# Helpers
# =========================

def _ensure_calldata(db: Session, call_id: str) -> CallData:
    """Get or create a CallData row for a given call_id."""
    cdata = db.query(CallData).filter(CallData.call_id == call_id).one_or_none()
    if not cdata:
        cdata = CallData(call_id=call_id)
        db.add(cdata)
        db.flush()  # assign PK
    return cdata


# =========================
# Controllers
# =========================

def list_calls_controller(
    db: Session,
    page: int = 1,
    per_page: int = 25,
    order: str = "desc",
    q: Optional[str] = None,                  # search in call_name / call_description (case-insensitive)
    date_from: Optional[datetime] = None,     # inclusive
    date_to: Optional[datetime] = None,       # exclusive
    agent_name: Optional[str] = None,         # partial, case-insensitive
    agent_id: Optional[int] = None,           # exact match
) -> PaginatedCallsResponse:
    """
    Return paginated calls with minimal fields + duration.
    """

    # duration per call via max(end_time) across chunks
    duration_subq = (
        db.query(
            AudioChunk.call_id.label("call_id"),
            func.coalesce(func.max(AudioChunk.end_time), 0.0).label("duration_sec"),
        )
        .group_by(AudioChunk.call_id)
        .subquery()
    )

    # filters (null-safe + case-insensitive)
    filters = []
    if q:
        q_like = f"%{q.lower()}%"
        filters.append(
            or_(
                func.lower(func.coalesce(CallData.call_name, "")).like(q_like),
                func.lower(func.coalesce(CallData.call_description, "")).like(q_like),
            )
        )
    if date_from:
        filters.append(Call.upload_time >= date_from)
    if date_to:
        filters.append(Call.upload_time < date_to)
    if agent_id is not None:
        filters.append(CallData.agent_id == agent_id)
    if agent_name:
        filters.append(func.lower(Agent.name).like(f"%{agent_name.lower()}%"))

    # total (distinct to avoid join inflation)
    total = (
        db.query(func.count(func.distinct(Call.id)))
        .outerjoin(CallData, CallData.call_id == Call.id)
        .outerjoin(Agent, Agent.id == CallData.agent_id)
        .filter(and_(*filters) if filters else True)
        .scalar()
        or 0
    )
    if total == 0:
        return PaginatedCallsResponse(page=page, per_page=per_page, total=0, page_count=0, items=[])

    page_count = (total + per_page - 1) // per_page
    if page > page_count:
        return PaginatedCallsResponse(page=page, per_page=per_page, total=total, page_count=page_count, items=[])

    # main query
    order_by = Call.upload_time.desc() if order == "desc" else Call.upload_time.asc()
    offset = (page - 1) * per_page

    rows = (
        db.query(
            Call.id,
            Call.upload_time,
            CallData.call_name,
            CallData.call_description,
            duration_subq.c.duration_sec,
            CallData.agent_id,
            Agent.name.label("agent_name"),
        )
        .outerjoin(CallData, CallData.call_id == Call.id)
        .outerjoin(Agent, Agent.id == CallData.agent_id)
        .outerjoin(duration_subq, duration_subq.c.call_id == Call.id)
        .filter(and_(*filters) if filters else True)
        .order_by(order_by)
        .offset(offset)
        .limit(per_page)
        .all()
    )

    items = [
        CallOut(
            id=r.id,
            call_name=r.call_name,
            call_description=r.call_description,
            upload_time=r.upload_time,
            duration_sec=float(r.duration_sec or 0.0),
            agent_id=r.agent_id,
            agent_name=r.agent_name,
        )
        for r in rows
    ]

    return PaginatedCallsResponse(
        page=page,
        per_page=per_page,
        total=total,
        page_count=page_count,
        prev_page=page - 1 if page > 1 else None,
        next_page=page + 1 if page < page_count else None,
        items=items,
    )


def get_call_controller(db: Session, call_id: str) -> CallDetailOut:
    call = db.query(Call).filter(Call.id == call_id).one_or_none()
    if not call:
        raise ValueError("CALL_NOT_FOUND")

    cdata = db.query(CallData).filter(CallData.call_id == call_id).one_or_none()

    return CallDetailOut(
        id=call.id,
        upload_time=call.upload_time,
        call_name=cdata.call_name if cdata else None,
        call_description=cdata.call_description if cdata else None,
        agent_id=cdata.agent_id if cdata else None,
    )


def update_call_controller(db: Session, call_id: str, payload: CallUpdateIn) -> CallDetailOut:
    call = db.query(Call).filter(Call.id == call_id).one_or_none()
    if not call:
        raise ValueError("CALL_NOT_FOUND")

    # Validate agent_id when explicitly provided (non-null)
    if payload.agent_id is not None and payload.agent_id is not None:
        agent = db.query(Agent).filter(Agent.id == payload.agent_id).one_or_none()
        if not agent:
            raise ValueError("AGENT_NOT_FOUND")

    # Ensure CallData exists
    cdata = _ensure_calldata(db, call_id)

    if payload.call_name is not None:
        cdata.call_name = payload.call_name  # may be None to clear
    if payload.call_description is not None:
        cdata.call_description = payload.call_description  # may be None to clear
    if payload.agent_id is not None:
        cdata.agent_id = payload.agent_id  # may be None to unset

    db.add(cdata)
    db.commit()
    db.refresh(cdata)
    db.refresh(call)

    return CallDetailOut(
        id=call.id,
        upload_time=call.upload_time,
        call_name=cdata.call_name,
        call_description=cdata.call_description,
        agent_id=cdata.agent_id,
    )
