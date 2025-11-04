# app/controllers/batch_controller.py

import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.models import (
    RunBatch, RunBatchCall, RunBatchTrigger,
    RunBatchStatus, RunBatchCallStatus,
    TriggerEval
)
from app.controllers.core.pipeline_controller import run_pipeline_for_call
from app.controllers.core.criteria_controller import (
    evaluate_call_on_triggers,
    _require_owned_trigger_ids,
)

def _now():
    return datetime.now(timezone.utc)

def _to_json_str(obj):
    """Serialize to JSON string if not already a string; allow None."""
    if obj is None:
        return None
    if isinstance(obj, str):
        return obj
    return json.dumps(obj, default=str)

def _from_json_maybe(s):
    """Safe JSON parse if s is a JSON string, else return as-is/None."""
    if s is None:
        return None
    if isinstance(s, (dict, list)):  # already a structure
        return s
    try:
        return json.loads(s)
    except Exception:
        return s

# -------------------------
# Batch creation
# -------------------------

def create_run_batch(
    db: Session,
    user_id: int,
    name: str,
    description: str | None,
    steps: Dict[str, Any],
    trigger_ids: List[int],
    fail_fast: bool
) -> RunBatch:
    if trigger_ids:
        _require_owned_trigger_ids(db, trigger_ids, user_id)

    batch = RunBatch(
        user_id=user_id,
        name=name,
        description=description,
        steps_json=json.dumps(steps),
        fail_fast=fail_fast,
        status=RunBatchStatus.draft.value,
    )
    db.add(batch)
    db.flush()

    for tid in trigger_ids:
        db.add(RunBatchTrigger(batch_id=batch.id, trigger_id=tid))

    db.commit()
    db.refresh(batch)
    return batch

def add_calls_to_batch(db: Session, batch_id: int, call_ids: List[str]):
    existing = db.query(RunBatchCall.call_id).filter(
        RunBatchCall.batch_id == batch_id
    ).all()
    existing_call_ids = {cid for (cid,) in existing}

    for call_id in call_ids:
        if call_id not in existing_call_ids:
            db.add(RunBatchCall(batch_id=batch_id, call_id=call_id))

    db.commit()

# -------------------------
# Batch execution
# -------------------------

def start_run_batch(db: Session, batch_id: int, user_id: int):
    batch = db.query(RunBatch).filter(
        RunBatch.id == batch_id, RunBatch.user_id == user_id
    ).one()

    if batch.status != RunBatchStatus.draft.value:
        return

    batch.started_at = _now()
    batch.status = RunBatchStatus.running.value
    db.commit()

    trigger_ids = [rbt.trigger_id for rbt in batch.triggers] or []
    calls = db.query(RunBatchCall).filter(
        RunBatchCall.batch_id == batch_id
    ).all()

    any_failed = False

    try:
        for run_call in calls:
            try:
                run_call.status = RunBatchCallStatus.running.value
                run_call.started_at = _now()
                db.commit()

                steps = json.loads(batch.steps_json) if batch.steps_json else {}
                summary = run_pipeline_for_call(run_call.call_id, steps=steps)

                if trigger_ids:
                    evaluate_call_on_triggers(
                        db, run_call.call_id, trigger_ids, user_id=user_id
                    )

                run_call.status = RunBatchCallStatus.succeeded.value
                run_call.result_summary = _to_json_str(summary)
                run_call.finished_at = _now()
                db.commit()

            except Exception as ex:
                db.rollback()
                run_call.status = RunBatchCallStatus.failed.value
                run_call.error = str(ex)
                run_call.finished_at = _now()
                any_failed = True
                try:
                    db.commit()
                except Exception:
                    db.rollback()

                if batch.fail_fast:
                    break

    except Exception as ex:
        # catastrophic error in batch execution
        db.rollback()
        batch.status = RunBatchStatus.failed.value
        batch.finished_at = _now()
        db.commit()
        raise

    finally:
        #  always finalize batch status
        if batch.status == RunBatchStatus.running.value:
            batch.status = (
                RunBatchStatus.failed.value if any_failed
                else RunBatchStatus.succeeded.value
            )
            batch.finished_at = _now()
            try:
                db.commit()
            except Exception:
                db.rollback()

# -------------------------
# Batch reporting
# -------------------------

def get_batch_progress(db: Session, batch_id: int) -> dict:
    row = db.query(
        func.coalesce(func.sum(RunBatchCall.chunk_done), 0),
        func.coalesce(func.sum(RunBatchCall.chunk_total), 0)
    ).filter(RunBatchCall.batch_id == batch_id).one()

    return {"done": row[0], "total": row[1]}

def get_batch_report(db: Session, batch_id: int, user_id: int) -> dict:
    batch = db.query(RunBatch).filter(
        RunBatch.id == batch_id, RunBatch.user_id == user_id
    ).one()

    calls = db.query(RunBatchCall).filter(
        RunBatchCall.batch_id == batch_id
    ).all()
    trigger_ids = [t.trigger_id for t in batch.triggers] or []

    report = []
    for rc in calls:
        trigger_hits = []
        seen = set()

        if trigger_ids:
            evals = db.query(TriggerEval).filter(
                TriggerEval.call_id == rc.call_id,
                TriggerEval.trigger_id.in_(trigger_ids)
            ).all()

            for ev in evals:
                if ev.trigger_id in seen:
                    continue
                evidence = getattr(ev, "evidence", None)
                evidence = _from_json_maybe(evidence)
                trigger_hits.append({
                    "trigger_id": ev.trigger_id,
                    "matched": ev.matched,
                    "evidence": evidence,
                })
                seen.add(ev.trigger_id)

        summary = _from_json_maybe(rc.result_summary)

        report.append({
            "call_id": rc.call_id,
            "status": rc.status,
            "summary": summary,
            "triggers": trigger_hits,
        })

    return {
        "batch_id": batch_id,
        "status": batch.status,
        "calls": report
    }

# -------------------------
# Test Harness
# -------------------------

if __name__ == "__main__":
    from app.core.database import SessionLocal
    from pprint import pprint

    db = SessionLocal()
    try:
        call_ids = [
            "450a1f76-ef59-4784-bba6-9b4fea9aecc4",
            "3188ab0b-0e7e-401e-b036-b90c329c11ef",
            "9538cbbc-8845-4c41-bd88-da61acffe518"
        ]
        trigger_ids = [1,2]

        print("Creating a new batch...")
        batch = create_run_batch(
            db,
            user_id=1,
            name="Test Batch Run",
            description="Batch created from __main__",
            steps={"transcription": True, "sentiment": True},
            trigger_ids=trigger_ids,
            fail_fast=False,
        )

        print(f"Batch {batch.id} created. Adding calls...")
        add_calls_to_batch(db, batch.id, call_ids)

        print(f"Starting batch {batch.id}...")
        start_run_batch(db, batch.id, user_id=1)

        print("Batch completed. Report:")
        report = get_batch_report(db, batch.id, user_id=1)
        pprint(report)

    finally:
        db.close()
