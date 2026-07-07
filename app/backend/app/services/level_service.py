from __future__ import annotations

from typing import Any, Dict

from app.models.user import User
from app.services.task_service import DAILY_TASKS, WEEKLY_TASKS, _get_progress
from sqlalchemy.orm import Session

def _ensure_experience_fields(user: User) -> None:
    if user.completed_daily_tasks is None:
        user.completed_daily_tasks = []
    if user.completed_weekly_tasks is None:
        user.completed_weekly_tasks = []
    if user.completed_achievement_chapters is None:
        user.completed_achievement_chapters = []
    if user.total_experience is None:
        user.total_experience = 0
    if user.level_progress_percent is None:
        user.level_progress_percent = 0
    if user.level is None:
        user.level = 1


def _count_completed_achievement_chapters(user: User) -> int:
    return len(user.completed_achievement_chapters or [])


def calculate_total_experience(user: User) -> int:
    _ensure_experience_fields(user)
    completed_daily = len(user.completed_daily_tasks or [])
    completed_weekly = len(user.completed_weekly_tasks or [])
    completed_chapters = _count_completed_achievement_chapters(user)
    
    total = (
        completed_daily * 25 + 
        completed_weekly * 50 + 
        completed_chapters * 25
    )
    return total


def update_level_and_progress(user: User) -> None:
    _ensure_experience_fields(user)
    total_exp = calculate_total_experience(user)
    user.total_experience = total_exp
    
    # Each level requires 100 exp to complete
    user.level = (total_exp // 100) + 1
    user.level_progress_percent = total_exp % 100


def add_experience_for_daily_task(user: User, task_id: str, db: Session | None = None) -> None:
    _ensure_experience_fields(user)
    if task_id not in (user.completed_daily_tasks or []):
        user.completed_daily_tasks.append(task_id)
        update_level_and_progress(user)
        if db:
            db.add(user)
            db.commit()
            db.refresh(user)


def add_experience_for_weekly_task(user: User, task_id: str, db: Session | None = None) -> None:
    _ensure_experience_fields(user)
    if task_id not in (user.completed_weekly_tasks or []):
        user.completed_weekly_tasks.append(task_id)
        update_level_and_progress(user)
        if db:
            db.add(user)
            db.commit()
            db.refresh(user)


def add_experience_for_achievement_chapter(user: User, chapter: int, db: Session | None = None) -> None:
    _ensure_experience_fields(user)
    if chapter not in (user.completed_achievement_chapters or []):
        user.completed_achievement_chapters.append(chapter)
        update_level_and_progress(user)
        if db:
            db.add(user)
            db.commit()
            db.refresh(user)


def calculate_level(user: User) -> int:
    update_level_and_progress(user)
    return user.level or 1


def migrate_existing_user(user: User, db: Session | None = None) -> None:
    """Calculate initial experience for existing users based on their current task progress."""
    _ensure_experience_fields(user)
    
    # We'll calculate based on current task completion and achievements
    # For now, we'll set a baseline
    update_level_and_progress(user)
    
    if db:
        db.add(user)
        db.commit()
        db.refresh(user)
