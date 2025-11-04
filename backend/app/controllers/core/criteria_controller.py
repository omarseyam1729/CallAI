import re
import logging
from typing import Any, Dict, Optional, List
from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.models import Trigger, TriggerEval
from app.controllers.core.ollama_controller import evaluate_semantic_trigger
from app.controllers.core.transcription_controller import get_full_transcription

logger = logging.getLogger(__name__)

@dataclass
class EvalResult:
    trigger_id: int
    trigger_name: str
    matched: bool
    score: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None

SUPPORTED_TYPES = {"regex", "semantic"}

# -------------------------
# Validation Utils
# -------------------------

def validate_trigger(type_: str, config: Dict[str, Any]) -> None:
    if type_ not in SUPPORTED_TYPES:
        raise ValueError(f"Unsupported trigger type: '{type_}'")
    if not isinstance(config, dict):
        raise ValueError("Trigger config must be a dictionary.")
    if type_ == "regex" and "pattern" not in config:
        raise ValueError("Regex triggers require a 'pattern'.")
    if type_ == "semantic" and "criteria_text" not in config:
        raise ValueError("Semantic triggers require 'criteria_text'.")

def _owned_trigger_ids(db: Session, ids: List[int], user_id: int) -> List[int]:
    return [
        trig.id for trig in db.query(Trigger).filter(Trigger.id.in_(ids), Trigger.user_id == user_id).all()
    ]

def _require_owned_trigger_ids(db: Session, ids: List[int], user_id: int) -> None:
    owned = _owned_trigger_ids(db, ids, user_id)
    if set(ids) != set(owned):
        raise ValueError("Some triggers are not owned by the user.")

def require_owned(db: Session, trigger_id: int, user_id: int) -> None:
    trig = db.query(Trigger).filter(Trigger.id == trigger_id, Trigger.user_id == user_id).first()
    if not trig:
        raise ValueError("Trigger not found or not owned by user.")

# -------------------------
# CRUD
# -------------------------

def create_trigger(db: Session, name: str, type_: str, config: Dict[str, Any], user_id: int, description: Optional[str] = None) -> Trigger:
    if db.query(Trigger).filter(Trigger.name == name).first():
        raise ValueError(f"Trigger with name '{name}' already exists.")
    validate_trigger(type_, config)
    trigger = Trigger(name=name, type=type_, config=config, description=description, user_id=user_id)
    db.add(trigger)
    db.commit()
    db.refresh(trigger)
    return trigger

def update_trigger(db: Session, *, trigger_id: Optional[int] = None, name: Optional[str] = None, patch: Dict[str, Any]) -> Trigger:
    trigger = get_trigger(db, trigger_id=trigger_id, name=name)
    new_type = patch.get("type", trigger.type)
    new_config = patch.get("config", trigger.config)
    validate_trigger(new_type, new_config)

    for key in ("name", "description", "type", "config"):
        if key in patch:
            setattr(trigger, key, patch[key])

    db.commit()
    db.refresh(trigger)
    return trigger

def delete_trigger(db: Session, *, trigger_id: Optional[int] = None, name: Optional[str] = None) -> None:
    trigger = get_trigger(db, trigger_id=trigger_id, name=name)
    db.delete(trigger)
    db.commit()

def get_trigger(db: Session, *, trigger_id: Optional[int] = None, name: Optional[str] = None) -> Trigger:
    if trigger_id:
        trigger = db.query(Trigger).filter_by(id=trigger_id).first()
    elif name:
        trigger = db.query(Trigger).filter_by(name=name).first()
    else:
        raise ValueError("Must provide trigger_id or name.")
    if not trigger:
        raise ValueError("Trigger not found.")
    return trigger

def list_triggers(db: Session) -> List[Trigger]:
    return db.query(Trigger).order_by(Trigger.name.asc()).all()

# -------------------------
# Evaluation Logic
# -------------------------

def evaluate_trigger_on_call_data(*, trigger: Trigger, transcript: str) -> EvalResult:
    if not transcript.strip():
        return EvalResult(trigger_id=trigger.id, trigger_name=trigger.name, matched=False, evidence={"warning": "Transcript is empty."})

    matched = False
    score = None
    evidence = {}

    if trigger.type == "regex":
        pattern = trigger.config.get("pattern")
        flags = 0 if trigger.config.get("case_sensitive") else re.IGNORECASE
        match = re.search(pattern, transcript, flags)
        if match:
            matched = True
            evidence = {
                "pattern": pattern,
                "span": [match.start(), match.end()],
                "text_snippet": transcript[max(0, match.start() - 40): match.end() + 40]
            }

    elif trigger.type == "semantic":
        criteria_text = trigger.config.get("criteria_text", "")
        matched, score, reasoning = evaluate_semantic_trigger(transcript, criteria_text)
        evidence = {"criteria_text": criteria_text, "reasoning": reasoning}

    return EvalResult(
        trigger_id=trigger.id,
        trigger_name=trigger.name,
        matched=matched,
        score=score,
        evidence=evidence
    )

def evaluate_call_on_trigger(db: Session, call_id: str, trigger_id: int, user_id: int = 1) -> EvalResult:
    require_owned(db, trigger_id, user_id)
    trigger = get_trigger(db, trigger_id=trigger_id)
    transcript = get_full_transcription(call_id)
    result = evaluate_trigger_on_call_data(trigger=trigger, transcript=transcript)

    db.add(TriggerEval(
        trigger_id=trigger.id,
        call_id=call_id,
        matched=result.matched,
        score=str(result.score) if result.score is not None else None,
        evidence=result.evidence
    ))
    db.commit()
    return result

def evaluate_call_on_triggers(db: Session, call_id: str, trigger_ids: List[int], user_id: int = 1) -> List[EvalResult]:
    _require_owned_trigger_ids(db, trigger_ids, user_id)
    transcript = get_full_transcription(call_id)
    results = []

    triggers = db.query(Trigger).filter(Trigger.id.in_(trigger_ids)).all()
    for trigger in triggers:
        result = evaluate_trigger_on_call_data(trigger=trigger, transcript=transcript)
        db.add(TriggerEval(
            trigger_id=trigger.id,
            call_id=call_id,
            matched=result.matched,
            score=str(result.score) if result.score is not None else None,
            evidence=result.evidence
        ))
        results.append(result)

    db.commit()
    return results


# -------------------------
# Test Harness
# -------------------------
if __name__ == "__main__":
    import json
    from app.core.database import SessionLocal

    db = SessionLocal()

    # Clean existing demo triggers
    for trig in list_triggers(db):
        if trig.name in ("RegexHello", "SemanticGreet"):
            delete_trigger(db, trigger_id=trig.id)

    # Create demo triggers
    regex_trigger = create_trigger(
        db,
        name="RegexHello",
        type_="regex",
        config={"pattern": r"\bhello\b", "case_sensitive": False},
        description="Trigger for 'hello' word",
        user_id=1
    )

    semantic_trigger = create_trigger(
        db,
        name="SemanticGreet",
        type_="semantic",
        config={"criteria_text": "Was there a mistake in the entire call?"},
        description="Trigger for mistake detection",
        user_id=1
    )

    test_call_id = "f5ec5fcd-a7a0-461b-9075-975d67575b02"

    print("=== Evaluating Single Trigger on Call ===")
    single_result = evaluate_call_on_trigger(
        db=db,
        call_id=test_call_id,
        trigger_id=regex_trigger.id
    )
    print(json.dumps(single_result.__dict__, indent=2))

    print("\n=== Evaluating Multiple Triggers on Call ===")
    multi_results = evaluate_call_on_triggers(
        db=db,
        call_id=test_call_id,
        trigger_ids=[regex_trigger.id, semantic_trigger.id]
    )
    for result in multi_results:
        print(json.dumps(result.__dict__, indent=2))

    db.close()
