from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Server(BaseModel):
    id: str = Field(alias="_id")
    name: str
    owner_id: str
    member_ids: List[str] = []

class Channel(BaseModel):
    id: str = Field(alias="_id")
    server_id: str
    name: str
    type: str = "text"

class Message(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    channel_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    channel_id: str
    sender_id: str
    sender_name: str
    content: str
