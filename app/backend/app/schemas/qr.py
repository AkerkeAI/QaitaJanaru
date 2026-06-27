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


class RecyclingPointQrListResponse(BaseModel):
    items: List[RecyclingPointQrResponse]
