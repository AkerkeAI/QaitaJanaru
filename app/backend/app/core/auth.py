import os
from datetime import datetime, timedelta, timezone

from app.models.user import User
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="JWT authentication is not configured")
    return secret


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def resolve_current_user(token: str, db: Session) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="INVALID_OR_EXPIRED_SESSION",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
        subject = payload.get("sub")
        user_id = int(subject) if subject is not None else None
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_error
    return user
