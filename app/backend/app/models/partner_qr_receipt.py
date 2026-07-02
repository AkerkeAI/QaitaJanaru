from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.session import Base


class PartnerQrReceipt(Base):
    __tablename__ = "partner_qr_receipts"

    id = Column(String, primary_key=True, index=True)
    exchange_id = Column(
        Integer, ForeignKey("partner_qr_exchanges.id"), nullable=False, unique=True, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    partner_name = Column(String, nullable=False)
    branch_name = Column(String, nullable=False)
    reward_title = Column(String, nullable=False)
    eco_points_spent = Column(Integer, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
