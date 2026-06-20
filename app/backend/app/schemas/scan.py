from pydantic import BaseModel
from typing import List


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
    new_total_points: int
