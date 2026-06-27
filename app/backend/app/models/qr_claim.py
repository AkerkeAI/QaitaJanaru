from datetime import datetime

from app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint


class QrClaim(Base):
    __tablename__ = "qr_claims"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "recycling_point_id", name="uq_user_point_qr_claim"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    recycling_point_id = Column(
        Integer, ForeignKey("recycling_points.id"), index=True, nullable=False
    )
    qr_identifier = Column(String, nullable=False)
    points_awarded = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
