from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    age = Column(Integer)

    city = Column(String)

    eco_points = Column(Integer, default=50)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    total_scans = Column(Integer, default=0)
    last_login_date = Column(Date, nullable=True)

    # Relationship to task progress
    task_progress = relationship("TaskProgress", back_populates="user", uselist=False)