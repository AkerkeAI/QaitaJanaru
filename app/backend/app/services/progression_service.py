from __future__ import annotations

from typing import Any, Dict

from app.models.user import User
from app.services.task_service import auto_claim_completed_tasks, record_scan
from app.services.user_service import add_eco_points, update_streak
from sqlalchemy.orm import Session


def apply_recycling_action_progression(
    db: Session,
    user: User,
    earned_points: int,
    scan_increment: int = 0,
) -> Dict[str, Any]:
    if scan_increment:
        user.total_scans = int(user.total_scans or 0) + int(scan_increment)
        db.add(user)
        db.commit()
        db.refresh(user)

    user = add_eco_points(db, user, earned_points)
    user = update_streak(db, user)
    record_scan(user, earned_points)

    reward_summary = auto_claim_completed_tasks(user)
    total_reward = int(earned_points) + int(reward_summary["task_rewards"])

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user": user,
        "earned_points": int(earned_points),
        "task_rewards": int(reward_summary["task_rewards"]),
        "daily_task_rewards": int(reward_summary["daily_task_rewards"]),
        "weekly_task_rewards": int(reward_summary["weekly_task_rewards"]),
        "auto_claimed_task_ids": list(reward_summary["claimed_task_ids"]),
        "total_reward": total_reward,
    }
