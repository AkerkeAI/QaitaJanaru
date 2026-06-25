from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class TaskProgress(Base):
    __tablename__ = "task_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Track completed and claimed task IDs
    completed_tasks = Column(JSON, default=list)
    claimed_rewards = Column(JSON, default=list)
    
    # Track daily/weekly reset times
    last_daily_reset = Column(DateTime, default=datetime.utcnow)
    last_weekly_reset = Column(DateTime, default=datetime.utcnow)
    
    # Current week set for rotation
    current_week_set = Column(String, default="A")
    
    # Track various action counts for progress calculation
    daily_visit_count = Column(Integer, default=0)
    eco_assistant_questions = Column(Integer, default=0)
    recycling_map_opens = Column(Integer, default=0)
    leaderboard_visits = Column(Integer, default=0)
    profile_visits = Column(Integer, default=0)
    settings_visits = Column(Integer, default=0)
    achievements_visits = Column(Integer, default=0)
    guide_reads = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="task_progress")
