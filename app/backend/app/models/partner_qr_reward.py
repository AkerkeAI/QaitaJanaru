from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.session import Base


class PartnerQrReward(Base):
    __tablename__ = "partner_qr_rewards"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    eco_points_required = Column(Integer, nullable=False)
    image = Column(String, nullable=False)
    category_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
