from datetime import datetime

from app.db.session import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String


class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String, index=True, nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    used_at = Column(DateTime, nullable=True)
    invalidated = Column(Boolean, default=False, nullable=False)
    request_ip = Column(String, nullable=True)
