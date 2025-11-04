# controllers/agent_controller.py
from sqlalchemy.orm import Session
from app.models import Agent
from app.schemas.agent import AgentCreate, AgentUpdate


def create_agent(db: Session, agent_in: AgentCreate) -> Agent:
    agent = Agent(**agent_in.dict())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def get_agent(db: Session, agent_id: int) -> Agent | None:
    return db.query(Agent).filter(Agent.id == agent_id).first()


def list_agents(db: Session):
    return db.query(Agent).all()


def update_agent(db: Session, agent_id: int, agent_in: AgentUpdate) -> Agent | None:
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return None
    for field, value in agent_in.dict(exclude_unset=True).items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent


def delete_agent(db: Session, agent_id: int) -> bool:
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return False
    db.delete(agent)
    db.commit()
    return True
