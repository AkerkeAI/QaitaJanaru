from datetime import datetime

from app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer


class RecyclingSubmission(Base):
    __tablename__ = "recycling_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    recycling_point_id = Column(
        Integer, ForeignKey("recycling_points.id"), index=True, nullable=False
    )
    plastic_bottles = Column(Integer, nullable=False, default=0)
    glass = Column(Integer, nullable=False, default=0)
    paper = Column(Integer, nullable=False, default=0)
    metal_cans = Column(Integer, nullable=False, default=0)
    batteries = Column(Integer, nullable=False, default=0)
    electronics = Column(Integer, nullable=False, default=0)
    cardboard = Column(Integer, nullable=False, default=0)
    other_recyclable = Column(Integer, nullable=False, default=0)
    total_points_awarded = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
