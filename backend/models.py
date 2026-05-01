from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(255), default="")
    interaction_type = Column(String(100), default="Meeting")
    date = Column(String(50), default="")
    time = Column(String(50), default="")
    attendees = Column(Text, default="")
    topics_discussed = Column(Text, default="")
    materials_shared = Column(Text, default="")
    sentiment = Column(String(50), default="neutral")
    summary = Column(Text, default="")
    follow_up = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())