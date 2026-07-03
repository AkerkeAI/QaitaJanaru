from typing import Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.level_service import calculate_level


def apply_inactivity_penalty(db: Session, user: User, current_date: date) -> User:
    """Calculate and apply daily inactivity penalty.
    
    Rules:
    - First 3 days of broken streak: no penalty
    - Starting day 4: subtract 5 eco points per day
    - Never go below 0
    """
    today = current_date or date.today()

    if not user.last_seen_at:
        # First time using app
        user.last_seen_at = today
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    days_since_last_seen = (today - user.last_seen_at).days

    if days_since_last_seen <= 0:
        # Already seen today, do nothing
        user.last_seen_at = today
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    last_penalty_date = user.last_penalty_applied_date

    start_day = (last_penalty_date + timedelta(days=1)) if last_penalty_date else user.last_seen_at + timedelta(days=1)
    end_day = today

    penalty_days = 0
    current_day = start_day
    while current_day <= end_day:
        days_since_break = (current_day - user.last_seen_at).days
        if days_since_break >= 4:
            penalty_days += 1
        current_day += timedelta(days=1)

    if penalty_days > 0:
        total_penalty = penalty_days * 5
        user.eco_points = max(0, (user.eco_points or 0) - total_penalty)
        user.last_penalty_applied_date = today

    user.last_seen_at = today

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_streak(db: Session, user: User) -> User:
    """Update user's streak based on last login/activity.
    
    Logic:
    - First time: set streak to 1
    - Same day: do nothing
    - Yesterday: increment streak
    - Missed days: reset streak to 1
    """
    today = date.today()
    
    if user.last_login_date is None:
        # First login/activity ever
        user.streak = 1
        user.last_login_date = today
    elif user.last_login_date == today:
        # Already updated today, do nothing
        pass
    elif user.last_login_date == today - timedelta(days=1):
        # Logged in yesterday, increment streak
        user.streak += 1
        user.last_login_date = today
    else:
        # Missed one or more days, reset streak
        user.streak = 1
        user.last_login_date = today
        
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def add_eco_points(db: Session, user: User, delta: int) -> User:
    """Add eco points to a user and recalculate level.

    Commits the change to the DB and refreshes the user object.
    """
    if not user:
        return user

    user.eco_points = (user.eco_points or 0) + int(delta)
    # Recalculate level based on total scans, streak, and achievements
    user.level = calculate_level(user)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def sync_user_level(db: Session, user: User) -> Optional[User]:
    """Ensure user's level matches their stats; fix and persist if not."""
    if not user:
        return None
    expected = calculate_level(user)
    if user.level != expected:
        user.level = expected
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
