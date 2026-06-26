from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User

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


def get_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/task-progress/{user_id}", response_model=TaskProgressResponse)
async def get_task_progress(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)

    return TaskProgressResponse(
        task_progress=user.task_progress or {},
        claimed_rewards=user.claimed_rewards or [],
        last_daily_reset=user.last_daily_reset,
        last_weekly_reset=user.last_weekly_reset,
        current_week_set=user.current_week_set or "week-set-a",
    )


@router.post("/task-progress/update/{user_id}")
async def update_task_progress(
    user_id: int,
    request: TaskProgressUpdate,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)

    if user.task_progress is None:
        user.task_progress = {}

    user.task_progress[request.task_id] = request.progress

    db.commit()

    return {
        "success": True,
        "message": "Task progress updated",
    }


@router.post("/claim-reward/{user_id}", response_model=ClaimRewardResponse)
async def claim_reward(
    user_id: int,
    request: ClaimRewardRequest,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)

    if user.claimed_rewards is None:
        user.claimed_rewards = []

    if request.task_id in user.claimed_rewards:
        return ClaimRewardResponse(
            success=False,
            eco_points=user.eco_points,
            message="Reward already claimed",
        )

    rewards = {
        "daily-visit": 5,
        "daily-eco": 5,
        "daily-scan": 5,
        "daily-map": 5,
        "weekly-streak": 50,
        "weekly-eco": 75,
        "weekly-scans": 50,
        "weekly-questions": 40,
    }

    reward = rewards.get(request.task_id, 0)

    user.eco_points += reward
    user.claimed_rewards.append(request.task_id)
    user.level = max(1, user.eco_points // 100 + 1)

    db.commit()

    return ClaimRewardResponse(
        success=True,
        eco_points=user.eco_points,
        message=f"Reward claimed: +{reward}",
    )

    reward = rewards.get(request.task_id, 0)

    user.eco_points += reward
    user.claimed_rewards.append(request.task_id)
    user.level = max(1, user.eco_points // 100 + 1)

    db.commit()

    return ClaimRewardResponse(
        success=True,
        eco_points=user.eco_points,
        message=f"Reward claimed: +{reward}",
    )


@router.post("/reset-daily/{user_id}")
async def reset_daily_tasks(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)

    now = datetime.utcnow()

    if user.task_progress is None:
        user.task_progress = {}

    for task in [
        "daily-visit",
        "daily-eco",
        "daily-scan",
        "daily-map",
    ]:
        user.task_progress.pop(task, None)

    user.last_daily_reset = now

    db.commit()

    return {
        "success": True,
        "message": "Daily tasks reset",
    }


@router.post("/reset-weekly/{user_id}")
async def reset_weekly_tasks(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)

    now = datetime.utcnow()

    if user.task_progress is None:
        user.task_progress = {}

    for task in [
        "weekly-streak",
        "weekly-eco",
        "weekly-scans",
        "weekly-questions",
    ]:
        user.task_progress.pop(task, None)

    week_sets = [
        "week-set-a",
        "week-set-b",
        "week-set-c",
    ]

    current = user.current_week_set or "week-set-a"

    idx = week_sets.index(current)
    user.current_week_set = week_sets[(idx + 1) % 3]

    user.last_weekly_reset = now

    db.commit()

    return {
        "success": True,
        "message": "Weekly tasks reset",
    }