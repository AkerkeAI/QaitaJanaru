from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.session import Base


class PartnerQrPartner(Base):
    __tablename__ = "partner_qr_partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
