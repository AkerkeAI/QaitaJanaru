from app.db.session import SessionLocal
from app.models.recycling_point import RecyclingPoint
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/recycling-points", tags=["recycling-points"])


class RecyclingPointResponse(BaseModel):
    id: int
    qr_identifier: str
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    description: str
    waste_type: str
    facility_type: str
    qr_url: str


class RecyclingPointListResponse(BaseModel):
    items: list[RecyclingPointResponse]
    total: int


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=RecyclingPointListResponse)
async def list_recycling_points(db: Session = Depends(get_db)):
    points = (
        db.query(RecyclingPoint)
        .order_by(RecyclingPoint.city.asc(), RecyclingPoint.name.asc())
        .all()
    )

    items = [
        RecyclingPointResponse(
            id=int(point.id),
            qr_identifier=str(point.qr_identifier),
            name=str(point.name),
            city=str(point.city),
            address=str(point.address),
            latitude=float(point.latitude),
            longitude=float(point.longitude),
            description=str(point.description),
            waste_type=str(point.waste_type),
            facility_type=str(point.facility_type),
            qr_url=f"https://qaita-janaru.vercel.app/qr/{point.id}",
        )
        for point in points
    ]

    return RecyclingPointListResponse(items=items, total=len(items))
