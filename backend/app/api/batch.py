# app/routes/batch.py

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import RunBatch, RunBatchCall, RunBatchTrigger
from app.controllers.batch.batch import (
    create_run_batch,
    add_calls_to_batch,
    start_run_batch,
    get_batch_progress,
    get_batch_report,
)
from app.controllers.core.criteria_controller import _require_owned_trigger_ids

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

# -------------------------
# Schemas
# -------------------------

class BatchCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    steps: Dict[str, Any]
    trigger_ids: List[int] = []
    fail_fast: bool = False

class BatchResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str

    class Config:
        orm_mode = True

class CallAttachRequest(BaseModel):
    call_ids: List[str]

class TriggerAttachRequest(BaseModel):
    trigger_ids: List[int]

# -------------------------
# Routes
# -------------------------

@router.post("/", response_model=BatchResponse)
def create_batch(req: BatchCreateRequest, db: Session = Depends(get_db)):
    batch = create_run_batch(
        db,
        user_id=DEFAULT_USER_ID,
        name=req.name,
        description=req.description,
        steps=req.steps,
        trigger_ids=req.trigger_ids,
        fail_fast=req.fail_fast,
    )
    return batch

@router.get("/", response_model=List[BatchResponse])
def list_batches(db: Session = Depends(get_db)):
    return db.query(RunBatch).order_by(RunBatch.created_at.desc()).all()

@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(RunBatch).filter(
        RunBatch.id == batch_id, RunBatch.user_id == DEFAULT_USER_ID
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(RunBatch).filter(
        RunBatch.id == batch_id, RunBatch.user_id == DEFAULT_USER_ID
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()
    return

# -------------------------
# Calls
# -------------------------

@router.post("/{batch_id}/calls", status_code=status.HTTP_204_NO_CONTENT)
def attach_calls(batch_id: int, req: CallAttachRequest, db: Session = Depends(get_db)):
    add_calls_to_batch(db, batch_id, req.call_ids)
    return

@router.delete("/{batch_id}/calls", status_code=status.HTTP_204_NO_CONTENT)
def detach_calls(batch_id: int, req: CallAttachRequest, db: Session = Depends(get_db)):
    db.query(RunBatchCall).filter(
        RunBatchCall.batch_id == batch_id,
        RunBatchCall.call_id.in_(req.call_ids),
    ).delete(synchronize_session=False)
    db.commit()
    return

# -------------------------
# Triggers
# -------------------------

@router.post("/{batch_id}/triggers", status_code=status.HTTP_204_NO_CONTENT)
def attach_triggers(batch_id: int, req: TriggerAttachRequest, db: Session = Depends(get_db)):
    _require_owned_trigger_ids(db, req.trigger_ids, DEFAULT_USER_ID)
    for tid in req.trigger_ids:
        db.add(RunBatchTrigger(batch_id=batch_id, trigger_id=tid))
    db.commit()
    return

@router.delete("/{batch_id}/triggers", status_code=status.HTTP_204_NO_CONTENT)
def detach_triggers(batch_id: int, req: TriggerAttachRequest, db: Session = Depends(get_db)):
    db.query(RunBatchTrigger).filter(
        RunBatchTrigger.batch_id == batch_id,
        RunBatchTrigger.trigger_id.in_(req.trigger_ids),
    ).delete(synchronize_session=False)
    db.commit()
    return

# -------------------------
# Execution
# -------------------------

@router.post("/{batch_id}/start", status_code=status.HTTP_202_ACCEPTED)
def start_batch(batch_id: int, db: Session = Depends(get_db)):
    start_run_batch(db, batch_id, user_id=DEFAULT_USER_ID)
    return {"message": f"Batch {batch_id} started."}

@router.get("/{batch_id}/progress")
def batch_progress(batch_id: int, db: Session = Depends(get_db)):
    return get_batch_progress(db, batch_id)

@router.get("/{batch_id}/report")
def batch_report(batch_id: int, db: Session = Depends(get_db)):
    return get_batch_report(db, batch_id, user_id=DEFAULT_USER_ID)
