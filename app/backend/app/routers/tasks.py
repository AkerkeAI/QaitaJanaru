from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.user import User
from app.models.task_progress import TaskProgress
from app.services.user_service import sync_user_level

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{user_id}")
def get_tasks(user_id: int, db: Session = Depends(get_db)):
    """Get user's tasks with current progress"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get or create task progress
    task_progress = db.query(TaskProgress).filter(TaskProgress.user_id == user_id).first()
    
    if not task_progress:
        task_progress = TaskProgress(
            user_id=user_id,
            completed_tasks=[],
            claimed_rewards=[],
            last_daily_reset=datetime.utcnow(),
            last_weekly_reset=datetime.utcnow(),
            current_week_set="A"
        )
        db.add(task_progress)
        db.commit()
        db.refresh(task_progress)

    # Check if daily reset is needed
    today = date.today()
    last_reset = task_progress.last_daily_reset.date()
    if today > last_reset:
        task_progress.completed_tasks = [t for t in task_progress.completed_tasks if not t.startswith("daily-")]
        task_progress.last_daily_reset = datetime.utcnow()
        db.commit()

    # Check if weekly reset is needed (every Sunday)
    week_number = today.isocalendar()[1]
    last_week = task_progress.last_weekly_reset.date().isocalendar()[1]
    if week_number > last_week or (week_number == 1 and last_week == 52):
        # Rotate week set every 2-3 weeks
        week_sets = ["A", "B", "C"]
        current_index = week_sets.index(task_progress.current_week_set)
        next_index = (current_index + 1) % len(week_sets)
        task_progress.current_week_set = week_sets[next_index]
        task_progress.completed_tasks = [t for t in task_progress.completed_tasks if not t.startswith("weekly-")]
        task_progress.last_weekly_reset = datetime.utcnow()
        db.commit()

    # Get current weekday (0 = Sunday, 6 = Saturday)
    weekday = today.weekday()

    # Generate daily tasks based on weekday
    daily_tasks = _get_daily_tasks(weekday, task_progress, user)
    
    # Generate weekly tasks based on current week set
    weekly_tasks = _get_weekly_tasks(task_progress.current_week_set, task_progress, user)
    
    # Generate achievements
    achievements = _get_achievements(task_progress, user)

    return {
        "daily_tasks": daily_tasks,
        "weekly_tasks": weekly_tasks,
        "achievements": achievements,
        "eco_points": user.eco_points,
        "level": user.level,
        "streak": user.streak,
        "total_scans": user.total_scans
    }


@router.post("/{user_id}/claim/{task_id}")
def claim_reward(user_id: int, task_id: str, db: Session = Depends(get_db)):
    """Claim reward for a completed task"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    task_progress = db.query(TaskProgress).filter(TaskProgress.user_id == user_id).first()
    if not task_progress:
        raise HTTPException(status_code=404, detail="Task progress not found")

    # Check if already claimed
    if task_id in task_progress.claimed_rewards:
        raise HTTPException(status_code=400, detail="Reward already claimed")

    # Get task details
    all_tasks = _get_all_tasks()
    task = next((t for t in all_tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if task is completed
    if task_id not in task_progress.completed_tasks:
        raise HTTPException(status_code=400, detail="Task not completed")

    # Award points
    user.eco_points += task["reward"]
    
    # Sync level
    user = sync_user_level(db, user)
    
    # Mark as claimed
    task_progress.claimed_rewards.append(task_id)
    
    db.commit()
    db.refresh(task_progress)
    db.refresh(user)

    return {
        "message": "Reward claimed successfully",
        "reward": task["reward"],
        "new_eco_points": user.eco_points,
        "new_level": user.level
    }


@router.post("/{user_id}/complete/{task_id}")
def complete_task(user_id: int, task_id: str, db: Session = Depends(get_db)):
    """Mark a task as completed"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    task_progress = db.query(TaskProgress).filter(TaskProgress.user_id == user_id).first()
    if not task_progress:
        raise HTTPException(status_code=404, detail="Task progress not found")

    # Check if already completed
    if task_id in task_progress.completed_tasks:
        return {"message": "Task already completed"}

    # Mark as completed
    task_progress.completed_tasks.append(task_id)
    db.commit()
    db.refresh(task_progress)

    return {"message": "Task completed successfully"}


def _get_daily_tasks(weekday: int, progress: TaskProgress, user: User) -> List[dict]:
    """Get daily tasks based on weekday"""
    weekday_tasks = {
        0: ["daily-visit", "daily-eco", "daily-map"],  # Sunday
        1: ["daily-scan", "daily-guide", "daily-leaderboard"],  # Monday
        2: ["daily-eco-x2", "daily-profile", "daily-map"],  # Tuesday
        3: ["daily-scan", "daily-leaderboard", "daily-settings"],  # Wednesday
        4: ["daily-eco", "daily-scan", "daily-map"],  # Thursday
        5: ["daily-visit", "daily-achievements", "daily-eco"],  # Friday
        6: ["daily-visit", "daily-leaderboard", "daily-map"],  # Saturday
    }
    
    task_ids = weekday_tasks.get(weekday, weekday_tasks[0])
    all_tasks = _get_all_tasks()
    
    return [_format_task(t, progress, user) for t in all_tasks if t["id"] in task_ids]


def _get_weekly_tasks(week_set: str, progress: TaskProgress, user: User) -> List[dict]:
    """Get weekly tasks based on current week set"""
    week_tasks = {
        "A": ["weekly-scans-5", "weekly-points-100", "weekly-days-5"],
        "B": ["weekly-eco-15", "weekly-map-7", "weekly-days-7"],
        "C": ["weekly-points-200", "weekly-scans-10", "weekly-streak-7"]
    }
    
    task_ids = week_tasks.get(week_set, week_tasks["A"])
    all_tasks = _get_all_tasks()
    
    return [_format_task(t, progress, user) for t in all_tasks if t["id"] in task_ids]


def _get_achievements(progress: TaskProgress, user: User) -> List[dict]:
    """Get all achievements"""
    all_tasks = _get_all_tasks()
    achievement_tasks = [t for t in all_tasks if t["type"] == "achievement"]
    return [_format_task(t, progress, user) for t in achievement_tasks]


def _format_task(task: dict, progress: TaskProgress, user: User) -> dict:
    """Format task with current progress and completion status"""
    completed = task["id"] in progress.completed_tasks
    claimed = task["id"] in progress.claimed_rewards
    
    # Calculate current progress based on user stats
    current = _calculate_task_progress(task, user)
    
    return {
        **task,
        "current": current,
        "completed": completed,
        "claimed": claimed
    }


def _calculate_task_progress(task: dict, user: User) -> int:
    """Calculate current progress for a task based on user stats"""
    task_id = task["id"]
    
    if "visit" in task_id:
        return 1  # Already visited if calling this endpoint
    elif "scan" in task_id:
        return min(user.total_scans, task["target"])
    elif "eco" in task_id:
        if "x2" in task_id:
            return min(user.total_scans, task["target"])  # Simplified
        return min(user.eco_points, task["target"])
    elif "map" in task_id:
        return 0  # Need to track map opens separately
    elif "leaderboard" in task_id:
        return 0  # Need to track leaderboard visits
    elif "profile" in task_id:
        return 0  # Need to track profile visits
    elif "settings" in task_id:
        return 0  # Need to track settings visits
    elif "achievements" in task_id:
        return 0  # Need to track achievements page visits
    elif "streak" in task_id:
        return min(user.streak, task["target"])
    elif "days" in task_id:
        return min(user.streak, task["target"])
    elif "guide" in task_id:
        return 0  # Need to track guide reads
    else:
        return 0


def _get_all_tasks() -> List[dict]:
    """Get all available tasks"""
    return [
        # Daily tasks
        {"id": "daily-visit", "title": "Visit the app", "description": "Open the app once today", "reward": 5, "target": 1, "type": "daily", "category": "app_usage", "icon": "📱"},
        {"id": "daily-eco", "title": "Ask Eco Assistant", "description": "Ask the Eco Assistant a question", "reward": 5, "target": 1, "type": "daily", "category": "eco_assistant", "icon": "🤖"},
        {"id": "daily-map", "title": "Open Recycling Map", "description": "Open the recycling map", "reward": 5, "target": 1, "type": "daily", "category": "app_usage", "icon": "🗺️"},
        {"id": "daily-scan", "title": "Scan waste item", "description": "Scan one waste item", "reward": 5, "target": 1, "type": "daily", "category": "scanning", "icon": "📸"},
        {"id": "daily-guide", "title": "Read Recycling Guide", "description": "Read the recycling guide", "reward": 5, "target": 1, "type": "daily", "category": "app_usage", "icon": "📖"},
        {"id": "daily-leaderboard", "title": "Visit Leaderboard", "description": "Check the leaderboard", "reward": 5, "target": 1, "type": "daily", "category": "social", "icon": "🏆"},
        {"id": "daily-eco-x2", "title": "Ask Eco Assistant twice", "description": "Ask the Eco Assistant 2 questions", "reward": 10, "target": 2, "type": "daily", "category": "eco_assistant", "icon": "🤖"},
        {"id": "daily-profile", "title": "Open Profile", "description": "Check your profile", "reward": 5, "target": 1, "type": "daily", "category": "app_usage", "icon": "👤"},
        {"id": "daily-settings", "title": "Open Settings", "description": "Check your settings", "reward": 5, "target": 1, "type": "daily", "category": "app_usage", "icon": "⚙️"},
        {"id": "daily-achievements", "title": "Read achievements", "description": "Check your achievements", "reward": 5, "target": 1, "type": "daily", "category": "progression", "icon": "🏅"},
        
        # Weekly tasks - Set A
        {"id": "weekly-scans-5", "title": "Scanner Pro", "description": "Complete 5 scans this week", "reward": 50, "target": 5, "type": "weekly", "weekSet": "A", "category": "scanning", "icon": "📸"},
        {"id": "weekly-points-100", "title": "Eco Points Master", "description": "Earn 100 eco points this week", "reward": 75, "target": 100, "type": "weekly", "weekSet": "A", "category": "progression", "icon": "🏆"},
        {"id": "weekly-days-5", "title": "Consistent User", "description": "Use the app 5 days this week", "reward": 50, "target": 5, "type": "weekly", "weekSet": "A", "category": "app_usage", "icon": "📅"},
        
        # Weekly tasks - Set B
        {"id": "weekly-eco-15", "title": "Curious Mind", "description": "Ask Eco Assistant 15 questions", "reward": 40, "target": 15, "type": "weekly", "weekSet": "B", "category": "eco_assistant", "icon": "🤖"},
        {"id": "weekly-map-7", "title": "Map Explorer", "description": "Open Recycling Map 7 times", "reward": 35, "target": 7, "type": "weekly", "weekSet": "B", "category": "app_usage", "icon": "🗺️"},
        {"id": "weekly-days-7", "title": "Weekly Streak", "description": "Use the app 7 days in a row", "reward": 50, "target": 7, "type": "weekly", "weekSet": "B", "category": "app_usage", "icon": "🔥"},
        
        # Weekly tasks - Set C
        {"id": "weekly-points-200", "title": "Eco Champion", "description": "Reach 200 eco points", "reward": 100, "target": 200, "type": "weekly", "weekSet": "C", "category": "progression", "icon": "🏆"},
        {"id": "weekly-scans-10", "title": "Scanner Expert", "description": "Complete 10 scans", "reward": 75, "target": 10, "type": "weekly", "weekSet": "C", "category": "scanning", "icon": "📸"},
        {"id": "weekly-streak-7", "title": "Streak Master", "description": "Maintain 7-day streak", "reward": 50, "target": 7, "type": "weekly", "weekSet": "C", "category": "progression", "icon": "🔥"},
        
        # Achievements
        {"id": "achievement-beginner", "title": "Eco Beginner", "description": "Join the QaitaJanaru community", "reward": 0, "target": 1, "type": "achievement", "chapter": 1, "chapterOrder": 1, "category": "progression", "icon": "🌱"},
        {"id": "achievement-first-scan", "title": "First Scan", "description": "Complete your first waste scan", "reward": 0, "target": 1, "type": "achievement", "chapter": 1, "chapterOrder": 2, "category": "scanning", "icon": "📸"},
        {"id": "achievement-first-eco", "title": "First Question", "description": "Ask Eco Assistant your first question", "reward": 0, "target": 1, "type": "achievement", "chapter": 1, "chapterOrder": 3, "category": "eco_assistant", "icon": "🤖"},
        {"id": "achievement-first-visit", "title": "First Visit", "description": "Visit a recycling center", "reward": 0, "target": 1, "type": "achievement", "chapter": 1, "chapterOrder": 4, "category": "app_usage", "icon": "🗺️"},
        {"id": "achievement-eco-250", "title": "Eco Enthusiast", "description": "Earn 250 eco points", "reward": 0, "target": 250, "type": "achievement", "chapter": 2, "chapterOrder": 1, "category": "progression", "icon": "🏆"},
        {"id": "achievement-scans-25", "title": "Scanner Pro", "description": "Complete 25 scans", "reward": 0, "target": 25, "type": "achievement", "chapter": 2, "chapterOrder": 2, "category": "scanning", "icon": "📸"},
        {"id": "achievement-streak-7", "title": "Week Warrior", "description": "Maintain 7-day streak", "reward": 0, "target": 7, "type": "achievement", "chapter": 2, "chapterOrder": 3, "category": "progression", "icon": "🔥"},
        {"id": "achievement-eco-20", "title": "Knowledge Seeker", "description": "Ask Eco Assistant 20 questions", "reward": 0, "target": 20, "type": "achievement", "chapter": 2, "chapterOrder": 4, "category": "eco_assistant", "icon": "🤖"},
        {"id": "achievement-eco-500", "title": "Eco Master", "description": "Earn 500 eco points", "reward": 0, "target": 500, "type": "achievement", "chapter": 3, "chapterOrder": 1, "category": "progression", "icon": "🏆"},
        {"id": "achievement-scans-75", "title": "Scanner Expert", "description": "Complete 75 scans", "reward": 0, "target": 75, "type": "achievement", "chapter": 3, "chapterOrder": 2, "category": "scanning", "icon": "📸"},
        {"id": "achievement-streak-14", "title": "Streak Champion", "description": "Maintain 14-day streak", "reward": 0, "target": 14, "type": "achievement", "chapter": 3, "chapterOrder": 3, "category": "progression", "icon": "🔥"},
        {"id": "achievement-weekly", "title": "Task Master", "description": "Complete all weekly tasks", "reward": 0, "target": 1, "type": "achievement", "chapter": 3, "chapterOrder": 4, "category": "progression", "icon": "📋"},
    ]
