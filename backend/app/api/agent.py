# routes/agent_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.controllers.agent import agent_controller
from app.schemas.agent import AgentCreate, AgentUpdate, AgentOut

# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



router = APIRouter()


@router.post("/", response_model=AgentOut)
def create_agent(agent_in: AgentCreate, db: Session = Depends(get_db)):
    return agent_controller.create_agent(db, agent_in)


@router.get("/", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    return agent_controller.list_agents(db)


@router.get("/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = agent_controller.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentOut)
def update_agent(agent_id: int, agent_in: AgentUpdate, db: Session = Depends(get_db)):
    agent = agent_controller.update_agent(db, agent_id, agent_in)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    success = agent_controller.delete_agent(db, agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}
