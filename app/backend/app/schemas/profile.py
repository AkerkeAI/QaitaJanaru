from pydantic import BaseModel


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