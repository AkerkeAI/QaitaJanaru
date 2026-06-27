from app.db.session import Base
from sqlalchemy import Column, Float, Integer, String


class RecyclingPoint(Base):
    __tablename__ = "recycling_points"

    id = Column(Integer, primary_key=True, index=True)
    qr_identifier = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    waste_type = Column(String, nullable=False)
    facility_type = Column(String, nullable=False)
