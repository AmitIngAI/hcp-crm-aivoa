from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InteractionCreate(BaseModel):
    hcp_name: str = ""
    interaction_type: str = "Meeting"
    date: str = ""
    time: str = ""
    attendees: str = ""
    topics_discussed: str = ""
    materials_shared: str = ""
    sentiment: str = "neutral"
    summary: str = ""
    follow_up: str = ""

class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    sentiment: Optional[str] = None
    summary: Optional[str] = None
    follow_up: Optional[str] = None

class InteractionResponse(BaseModel):
    id: int
    hcp_name: str
    interaction_type: str
    date: str
    time: str
    attendees: str
    topics_discussed: str
    materials_shared: str
    sentiment: str
    summary: str
    follow_up: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    interaction_id: Optional[int] = None

class ChatResponse(BaseModel):
    message: str
    extracted_data: Optional[dict] = None
    tool_used: Optional[str] = None