from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey

from app.db.session import Base


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    waste_type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    eco_tip = Column(String, nullable=False)
    recycling_advice = Column(String, nullable=False)
    earned_points = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
