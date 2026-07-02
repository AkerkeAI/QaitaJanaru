from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.session import Base


class PartnerQrExchange(Base):
    __tablename__ = "partner_qr_exchanges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    branch_id = Column(
        Integer, ForeignKey("partner_qr_branches.id"), nullable=False, index=True
    )
    reward_id = Column(
        String, ForeignKey("partner_qr_rewards.id"), nullable=False, index=True
    )
    qr_code_id = Column(
        Integer, ForeignKey("partner_qr_codes.id"), nullable=False, index=True
    )
    status = Column(String, nullable=False, default="completed")
    eco_points_spent = Column(Integer, nullable=False, default=0)
    eco_points_balance_after = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
