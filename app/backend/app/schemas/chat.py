from pydantic import BaseModel
from datetime import datetime


class ChatMessageRequest(BaseModel):
    text: str


class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    text: str
    is_user: bool
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
