from datetime import datetime
from typing import Dict, List, Optional

from app.db.session import SessionLocal
from app.models.user import User
from app.services.task_service import (
    DAILY_TASK_IDS,
    WEEKLY_TASK_IDS,
    build_task_payload,
    claim_task_reward,
    recompute_all_task_progress,
    reset_daily_tasks_if_needed,
    reset_weekly_tasks_if_needed,
    sync_task_state,
)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TaskProgressUpdate(BaseModel):
    task_id: str
    progress: int


class ClaimRewardRequest(BaseModel):
    task_id: str


class TaskItemResponse(BaseModel):
    id: str
    title: str
    description: str
    reward: int
    target: int
    current: int
    completed: bool
    claimed: bool
    type: str
    category: str
    icon: str


class TaskProgressResponse(BaseModel):
    task_progress: Dict[str, int]
    claimed_rewards: List[str]
    last_daily_reset: Optional[datetime]
    last_weekly_reset: Optional[datetime]
    daily_tasks: List[TaskItemResponse]
    weekly_tasks: List[TaskItemResponse]


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
    sync_task_state(user, db)
    recompute_all_task_progress(user, db)
    payload = build_task_payload(user)
    return TaskProgressResponse(**payload)


@router.post("/task-progress/update/{user_id}")
async def update_task_progress(
    user_id: int,
    request: TaskProgressUpdate,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    sync_task_state(user)

    valid_task_ids = DAILY_TASK_IDS | WEEKLY_TASK_IDS
    if request.task_id not in valid_task_ids:
        raise HTTPException(status_code=400, detail="Unknown task id")

    if user.task_progress is None:
        user.task_progress = {}

    user.task_progress[request.task_id] = max(0, int(request.progress))
    db.add(user)
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
    success, eco_points, message = claim_task_reward(user, request.task_id, db)

    if success:
        db.add(user)
        db.commit()
        db.refresh(user)

    return ClaimRewardResponse(
        success=success,
        eco_points=eco_points,
        message=message,
    )


@router.post("/reset-daily/{user_id}")
async def reset_daily_tasks(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    changed = reset_daily_tasks_if_needed(user)
    recompute_all_task_progress(user)
    db.add(user)
    db.commit()

    return {
        "success": True,
        "message": "Daily tasks reset" if changed else "Daily tasks already up to date",
    }


@router.post("/reset-weekly/{user_id}")
async def reset_weekly_tasks(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    changed = reset_weekly_tasks_if_needed(user)
    recompute_all_task_progress(user)
    db.add(user)
    db.commit()

    return {
        "success": True,
        "message": "Weekly tasks reset"
        if changed
        else "Weekly tasks already up to date",
    }


class TaskEventRequest(BaseModel):
    event: str


@router.post("/event/{user_id}")
async def register_task_event(
    user_id: int, request: TaskEventRequest, db: Session = Depends(get_db)
):
    user = get_user(db, user_id)
    sync_task_state(user, db)

    if request.event == "map_visit":
        from app.services.task_service import record_map_visit

        record_map_visit(user)
    elif request.event == "route_open":
        from app.services.task_service import record_route_open

        record_route_open(user)
    else:
        raise HTTPException(status_code=400, detail="Unknown task event")

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Task event registered",
    }
