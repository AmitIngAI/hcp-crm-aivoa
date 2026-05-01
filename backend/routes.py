from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Interaction
from schemas import (
    InteractionCreate, InteractionUpdate,
    InteractionResponse, ChatRequest, ChatResponse
)
from agent import run_agent
from typing import List

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        result = run_agent(req.message, req.interaction_id)
        return ChatResponse(
            message=result["message"],
            extracted_data=result.get("extracted_data"),
            tool_used=result.get("tool_used"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/interactions", response_model=InteractionResponse)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    interaction = Interaction(**data.dict())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.get("/api/interactions", response_model=List[InteractionResponse])
def get_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()

@router.get("/api/interactions/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")
    return interaction

@router.put("/api/interactions/{interaction_id}", response_model=InteractionResponse)
def update_interaction(
    interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)
):
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(interaction, field, value)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.delete("/api/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Deleted"}