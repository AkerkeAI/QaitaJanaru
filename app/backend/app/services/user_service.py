from typing import Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.level_service import calculate_level





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
