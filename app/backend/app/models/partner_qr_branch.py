from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.db.session import Base


class PartnerQrBranch(Base):
    __tablename__ = "partner_qr_branches"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(
        Integer, ForeignKey("partner_qr_partners.id"), nullable=False, index=True
    )
    name = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    instagram = Column(String, nullable=True)
    working_hours = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
