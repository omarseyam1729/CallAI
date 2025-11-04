# app/routes/triggers.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import TriggerEval

from app.core.database import SessionLocal
from app.models import Trigger
from app.schemas.trigger import (
    TriggerCreateRequest,
    TriggerUpdateRequest,
    TriggerResponse,
    TriggerEvalRequest,   # expects: call_id: str, trigger_ids: List[int]
    TriggerEvalResult,
)
from app.controllers.core.criteria_controller import (
    create_trigger,
    update_trigger,
    delete_trigger,
    get_trigger,
    # list_triggers  # not used directly to enforce per-user filtering here
    evaluate_call_on_trigger,
    evaluate_call_on_triggers,
    _require_owned_trigger_ids,
    require_owned,
)

router = APIRouter()
DEFAULT_USER_ID = 1



# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# -----------------------------
# Helper schema (single-trigger eval)
# -----------------------------
class _SingleCallEval(BaseModel):
    call_id: str





# ----------------------------------------
# CRUD Endpoints
# ----------------------------------------

@router.post("/", response_model=TriggerResponse, status_code=status.HTTP_201_CREATED)
def create_trigger_route(
    data: TriggerCreateRequest,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    try:
        trig = create_trigger(
            db=db,
            name=data.name,
            type_=data.type,
            config=data.config,
            description=data.description,
            user_id=user_id,
        )
        return trig
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{trigger_id}", response_model=TriggerResponse)
def update_trigger_route(
    trigger_id: int,
    data: TriggerUpdateRequest,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    # ensure ownership before updating
    _require_owned_trigger_ids(db, [trigger_id], user_id)
    try:
        trig = update_trigger(db, trigger_id=trigger_id, patch=data.dict(exclude_unset=True))
        return trig
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{trigger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trigger_route(
    trigger_id: int,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    _require_owned_trigger_ids(db, [trigger_id], user_id)
    try:
        delete_trigger(db, trigger_id=trigger_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{trigger_id}", response_model=TriggerResponse)
def get_trigger_route(
    trigger_id: int,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    trig = get_trigger(db, trigger_id=trigger_id)
    if trig.user_id != user_id:
        raise HTTPException(status_code=403, detail="Trigger not owned by user.")
    return trig


@router.get("/", response_model=List[TriggerResponse])
def list_triggers_route(
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    # Enforce per-user listing here
    return (
        db.query(Trigger)
        .filter(Trigger.user_id == user_id)
        .order_by(Trigger.name.asc())
        .all()
    )


# ----------------------------------------
# Evaluation Endpoints (single call)
# ----------------------------------------

@router.post("/{trigger_id}/evaluate", response_model=TriggerEvalResult)
def evaluate_single_trigger_on_call_route(
    trigger_id: int,
    data: _SingleCallEval,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    """
    Evaluate ONE trigger (path param) on ONE call (body.call_id).
    """
    try:
        # ownership check for this trigger
        require_owned(db, trigger_id, user_id)

        result = evaluate_call_on_trigger(
            db=db,
            call_id=data.call_id,
            trigger_id=trigger_id,
            user_id=user_id,
        )
        return TriggerEvalResult(
            call_id=data.call_id,
            trigger_id=result.trigger_id,
            trigger_name=result.trigger_name,
            matched=result.matched,
            score=result.score,
            evidence=result.evidence,
        )
    except ValueError as e:
        # ownership / validation errors bubble as 400/403/404 in routes
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate", response_model=List[TriggerEvalResult])
def evaluate_multiple_triggers_on_call_route(
    data: TriggerEvalRequest,  # expects: call_id + trigger_ids
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    """
    Evaluate MULTIPLE triggers (body.trigger_ids) on ONE call (body.call_id).
    """
    # enforce ownership for all provided trigger IDs
    _require_owned_trigger_ids(db, data.trigger_ids, user_id)

    try:
        results = evaluate_call_on_triggers(
            db=db,
            call_id=data.call_id,
            trigger_ids=data.trigger_ids,
            user_id=user_id,
        )
        return [
            TriggerEvalResult(
                call_id=data.call_id,
                trigger_id=r.trigger_id,
                trigger_name=r.trigger_name,
                matched=r.matched,
                score=r.score,
                evidence=r.evidence,
            )
            for r in results
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# app/routes/triggers.py (add near the other imports)


# ...

@router.get("/{trigger_id}/evaluations", response_model=List[TriggerEvalResult])
def list_evaluations_for_trigger_route(
    trigger_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user_id: int = DEFAULT_USER_ID,
):
    """
    List prior evaluations for a trigger from trigger_eval table (most recent first).
    """
    # Ensure ownership
    require_owned(db, trigger_id, user_id)

    # Pull trigger (to get name)
    trig = get_trigger(db, trigger_id=trigger_id)

    # Order by created_at desc if you have it; otherwise by id desc
    q = (
        db.query(TriggerEval)
        .filter(TriggerEval.trigger_id == trigger_id)
        .order_by(desc(getattr(TriggerEval, "created_at", TriggerEval.id)))
        .offset(offset)
        .limit(limit)
    )

    rows = q.all()

    # Map to TriggerEvalResult (same schema you already use)
    results = [
        TriggerEvalResult(
            call_id=row.call_id,
            trigger_id=trig.id,
            trigger_name=trig.name,
            matched=bool(row.matched),
            score=float(row.score) if row.score is not None else None,
            evidence=row.evidence,
        )
        for row in rows
    ]
    return results
