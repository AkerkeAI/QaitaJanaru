from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()


class TaskProgressUpdate(BaseModel):
    task_id: str
    progress: int


class ClaimRewardRequest(BaseModel):
    task_id: str


class TaskProgressResponse(BaseModel):
    task_progress: dict
    claimed_rewards: List[str]
    last_daily_reset: Optional[datetime]
    last_weekly_reset: Optional[datetime]
    current_week_set: str


class ClaimRewardResponse(BaseModel):
    success: bool
    eco_points: int
    message: str


@router.get("/task-progress", response_model=TaskProgressResponse)
async def get_task_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's task progress"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return TaskProgressResponse(
        task_progress=user.task_progress or {},
        claimed_rewards=user.claimed_rewards or [],
        last_daily_reset=user.last_daily_reset,
        last_weekly_reset=user.last_weekly_reset,
        current_week_set=user.current_week_set or "week-set-a"
    )


@router.post("/task-progress/update")
async def update_task_progress(
    request: TaskProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update progress for a specific task"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.task_progress:
        user.task_progress = {}
    
    user.task_progress[request.task_id] = request.progress
    db.commit()
    
    return {"success": True, "message": "Task progress updated"}


@router.post("/claim-reward", response_model=ClaimRewardResponse)
async def claim_reward(
    request: ClaimRewardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim reward for a completed task"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if reward already claimed
    if not user.claimed_rewards:
        user.claimed_rewards = []
    
    if request.task_id in user.claimed_rewards:
        return ClaimRewardResponse(
            success=False,
            eco_points=user.eco_points,
            message="Reward already claimed"
        )
    
    # Get task reward amount (this would normally come from task definitions)
    # For now, we'll use a simple mapping
    task_rewards = {
        "daily-visit": 5,
        "daily-eco": 5,
        "daily-scan": 5,
        "daily-map": 5,
        "weekly-streak": 50,
        "weekly-eco": 75,
        "weekly-scans": 50,
        "weekly-questions": 40,
    }
    
    reward = task_rewards.get(request.task_id, 0)
    
    if reward == 0:
        return ClaimRewardResponse(
            success=False,
            eco_points=user.eco_points,
            message="Task not found or has no reward"
        )
    
    # Add reward to eco points
    user.eco_points += reward
    user.claimed_rewards.append(request.task_id)
    
    # Update level based on eco points
    new_level = max(1, user.eco_points // 100 + 1)
    user.level = new_level
    
    db.commit()
    
    return ClaimRewardResponse(
        success=True,
        eco_points=user.eco_points,
        message=f"Reward claimed: +{reward} points"
    )


@router.post("/reset-daily")
async def reset_daily_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset daily tasks (called automatically or manually)"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if reset is needed (once per day)
    now = datetime.utcnow()
    if user.last_daily_reset:
        last_reset = user.last_daily_reset
        if last_reset.date() == now.date():
            return {"success": True, "message": "Daily tasks already reset today"}
    
    # Reset daily task progress
    if not user.task_progress:
        user.task_progress = {}
    
    # Clear daily task progress
    daily_task_ids = ["daily-visit", "daily-eco", "daily-scan", "daily-map"]
    for task_id in daily_task_ids:
        if task_id in user.task_progress:
            del user.task_progress[task_id]
    
    user.last_daily_reset = now
    db.commit()
    
    return {"success": True, "message": "Daily tasks reset"}


@router.post("/reset-weekly")
async def reset_weekly_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset weekly tasks and rotate to next set"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if reset is needed (once per week)
    now = datetime.utcnow()
    if user.last_weekly_reset:
        last_reset = user.last_weekly_reset
        if (now - last_reset).days < 7:
            return {"success": True, "message": "Weekly tasks already reset this week"}
    
    # Reset weekly task progress
    if not user.task_progress:
        user.task_progress = {}
    
    # Clear weekly task progress
    weekly_task_ids = ["weekly-streak", "weekly-eco", "weekly-scans", "weekly-questions"]
    for task_id in weekly_task_ids:
        if task_id in user.task_progress:
            del user.task_progress[task_id]
    
    # Rotate to next week set
    week_sets = ["week-set-a", "week-set-b", "week-set-c"]
    current_index = week_sets.index(user.current_week_set or "week-set-a")
    next_index = (current_index + 1) % len(week_sets)
    user.current_week_set = week_sets[next_index]
    
    user.last_weekly_reset = now
    db.commit()
    
    return {"success": True, "message": f"Weekly tasks reset. New set: {user.current_week_set}"}
