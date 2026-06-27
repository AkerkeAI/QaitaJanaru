from typing import List

from pydantic import BaseModel


class ScanResponse(BaseModel):
    waste_type: str
    category: str
    recycling_category: str
    confidence: float
    eco_tip: str
    recycling_advice: str
    preparation_steps: List[str]
    recyclable: bool
    earned_points: int
    scan_reward: int
    task_rewards: int
    daily_task_rewards: int
    weekly_task_rewards: int
    auto_claimed_task_ids: List[str]
    total_reward: int
    new_total_points: int
