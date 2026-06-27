from datetime import datetime

from app.db.session import SessionLocal
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatHistoryResponse, ChatMessageResponse
from app.services.task_service import record_chat_message
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/history/{user_id}", response_model=ChatHistoryResponse)
async def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Get all chat messages for a specific user, ordered by timestamp."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )

    return ChatHistoryResponse(messages=messages)


@router.post("/message/{user_id}/user", response_model=ChatMessageResponse)
async def save_user_message(
    user_id: int, message_text: str, db: Session = Depends(get_db)
):
    """Save a user message to the database."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    chat_message = ChatMessage(
        user_id=user_id, text=message_text, is_user=True, timestamp=datetime.utcnow()
    )

    db.add(chat_message)
    record_chat_message(user)
    db.commit()
    db.refresh(chat_message)

    return chat_message


@router.post("/message/{user_id}/assistant", response_model=ChatMessageResponse)
async def save_assistant_message(
    user_id: int, message_text: str, db: Session = Depends(get_db)
):
    """Save an assistant message to the database."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    chat_message = ChatMessage(
        user_id=user_id, text=message_text, is_user=False, timestamp=datetime.utcnow()
    )

    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return chat_message


@router.delete("/history/{user_id}")
async def clear_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Delete all chat messages for a user."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_count = (
        db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    )

    db.commit()

    return {"message": f"Deleted {deleted_count} messages"}
