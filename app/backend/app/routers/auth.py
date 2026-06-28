from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.password_reset import (
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetVerifyRequest,
)
from app.schemas.user import UserCreate, UserLogin
from app.services.password_reset_service import (
    create_password_reset_request,
    reset_password_with_code,
    verify_and_upgrade_user_password,
    verify_password_reset_code,
)
from app.services.task_service import record_login
from app.services.user_service import update_streak
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

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
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_EXISTS")

    new_user = User(
        full_name=user.full_name,
        email=user.email.strip().lower(),
        password=hash_password(user.password),
        city=user.city,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": new_user.id}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email.strip().lower()).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")

    if not verify_and_upgrade_user_password(db, db_user, user.password):
        raise HTTPException(status_code=401, detail="INCORRECT_PASSWORD")

    # Update streak logic
    db_user = update_streak(db, db_user)
    record_login(db_user)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "eco_points": db_user.eco_points,
        "streak": db_user.streak,
    }


@router.post("/forgot-password/request")
def request_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    message = create_password_reset_request(
        db,
        payload.email,
        request.client.host if request.client else None,
    )
    return {"message": message}


@router.post("/forgot-password/verify")
def verify_password_reset(
    payload: PasswordResetVerifyRequest, db: Session = Depends(get_db)
):
    is_valid = verify_password_reset_code(db, payload.email, payload.code.strip())
    if not is_valid:
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_RESET_CODE")
    return {"message": "Verification code accepted"}


@router.post("/forgot-password/reset")
def confirm_password_reset(
    payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)
):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="PASSWORD_TOO_SHORT")

    success = reset_password_with_code(
        db,
        payload.email,
        payload.code.strip(),
        payload.new_password,
    )
    if not success:
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_RESET_CODE")

    return {"message": "Password reset successful"}


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")

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
