from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.db.session import Base


class PartnerQrAnalytics(Base):
    __tablename__ = "partner_qr_analytics"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(
        Integer, ForeignKey("partner_qr_partners.id"), nullable=False, unique=True, index=True
    )
    qr_scans = Column(Integer, nullable=False, default=0)
    page_visits = Column(Integer, nullable=False, default=0)
    route_requests = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
