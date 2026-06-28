from typing import List

from pydantic import BaseModel


class RecyclingPointQrResponse(BaseModel):
    id: int
    qr_identifier: str
    name: str
    city: str
    address: str
    waste_type: str
    facility_type: str
    qr_url: str
    qr_value: str
    qr_svg: str


class QrClaimRequest(BaseModel):
    user_id: int
    qr_identifier: str


class RecyclingSubmissionQuantities(BaseModel):
    plastic_bottles: int = 0
    glass: int = 0
    paper: int = 0
    metal_cans: int = 0
    batteries: int = 0
    electronics: int = 0
    cardboard: int = 0
    other_recyclable: int = 0


class SubmitQrRecyclingRequest(BaseModel):
    user_id: int
    qr_identifier: str
    quantities: RecyclingSubmissionQuantities


class QrClaimResponse(BaseModel):
    success: bool
    message: str
    recycling_point_id: int | None = None
    recycling_point_name: str | None = None
    qr_identifier: str | None = None
    points_awarded: int = 0
    eco_points: int = 0
    task_rewards: int = 0
    total_reward: int = 0


class SubmitQrRecyclingResponse(BaseModel):
    success: bool
    message: str
    recycling_point_id: int | None = None
    recycling_point_name: str | None = None
    qr_identifier: str | None = None
    submitted_quantities: RecyclingSubmissionQuantities
    recycling_reward: int = 0
    task_rewards: int = 0
    total_reward: int = 0
    eco_points: int = 0
    daily_task_rewards: int = 0
    weekly_task_rewards: int = 0
    auto_claimed_task_ids: List[str] = []


class RecyclingPointQrListResponse(BaseModel):
    items: List[RecyclingPointQrResponse]
