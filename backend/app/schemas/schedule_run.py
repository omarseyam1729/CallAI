# app/schemas/scheduled_run.py
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field


class ScheduledRunBase(BaseModel):
    call_id: UUID = Field(..., description="Target call to run pipeline on")
    run_at: datetime = Field(..., description="Exact timestamp when to run")
    steps_json: Optional[Dict[str, bool]] = Field(
        default_factory=dict,
        description="Which pipeline steps to run",
    )


class ScheduledRunCreate(ScheduledRunBase):
    pass


class ScheduledRunRead(ScheduledRunBase):
    id: int
    active: bool
    created_at: datetime

    class Config:
        orm_mode = True
