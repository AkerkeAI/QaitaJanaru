from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.models.scan_history import ScanHistory
from app.services.user_service import sync_user_level

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure stored level matches total eco points; auto-fix old accounts
    user = sync_user_level(db, user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "city": user.city,

        "eco_points": user.eco_points,
        "level": user.level,
        "streak": user.streak,
        "total_scans": user.total_scans,
    }


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete all related data
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.query(ScanHistory).filter(ScanHistory.user_id == user_id).delete()
    # Then delete the user
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/public/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure stored level matches total eco points; auto-fix old accounts
    user = sync_user_level(db, user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "city": user.city,
        "eco_points": user.eco_points,
        "level": user.level,
        "streak": user.streak,
        "total_scans": user.total_scans
    }