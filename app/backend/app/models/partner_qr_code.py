from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.db.session import Base


class PartnerQrCode(Base):
    __tablename__ = "partner_qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    qr_identifier = Column(String, nullable=False, unique=True, index=True)
    assigned_branch_id = Column(
        Integer, ForeignKey("partner_qr_branches.id"), nullable=True, unique=True, index=True
    )
    is_reserved = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
