from sqlalchemy import Column, Integer, String, Date, JSON, DateTime
from datetime import datetime

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

    # Task progress fields
    task_progress = Column(JSON, nullable=True)
    claimed_rewards = Column(JSON, nullable=True, default=list)
    last_daily_reset = Column(DateTime, nullable=True)
    last_weekly_reset = Column(DateTime, nullable=True)
    current_week_set = Column(String, nullable=True, default="week-set-a")