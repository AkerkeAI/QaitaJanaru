from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return {"error": "User already exists"}

    new_user = User(
    full_name=user.full_name,
    email=user.email,
    password=user.password,
    city=user.city,
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        return {"error": "Invalid credentials"}

    if db_user.password != user.password:
        return {"error": "Invalid credentials"}

    # Update streak logic
    today = date.today()
    
    if db_user.last_login_date is None:
        # First login ever
        db_user.streak = 1
        db_user.last_login_date = today
    elif db_user.last_login_date == today:
        # Already logged in today, do nothing
        pass
    elif db_user.last_login_date == today - timedelta(days=1):
        # Logged in yesterday, increment streak
        db_user.streak += 1
        db_user.last_login_date = today
    else:
        # Missed one or more days, reset streak
        db_user.streak = 1
        db_user.last_login_date = today
    
    db.commit()
    db.refresh(db_user)

    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "eco_points": db_user.eco_points,
        "streak": db_user.streak
    }

@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return {"error": "User not found"}

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