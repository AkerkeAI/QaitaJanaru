from typing import List

from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    city: str | None = None


class RecyclingMaterialStatsResponse(BaseModel):
    key: str
    quantity: int


class RecentRecyclingActivityResponse(BaseModel):
    id: int
    created_at: str
    recycling_point_name: str
    material: str
    quantity: int
    eco_points_awarded: int


class RecyclingAnalyticsResponse(BaseModel):
    total_recycling_actions: int
    total_eco_points_earned: int
    materials: List[RecyclingMaterialStatsResponse]
    recent_activity: List[RecentRecyclingActivityResponse]


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    city: str
    user_type: str
    institution: str

    eco_points: int
    level: int
    streak: int
    total_scans: int
    analytics: RecyclingAnalyticsResponse
