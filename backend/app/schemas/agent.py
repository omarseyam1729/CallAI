# schemas/agent.py
from pydantic import BaseModel
from typing import Optional


class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None


class AgentOut(AgentBase):
    id: int

    class Config:
        orm_mode = True
