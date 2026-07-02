from app.db.session import SessionLocal
from app.models.chat_message import ChatMessage
from app.models.recycling_point import RecyclingPoint
from app.models.recycling_submission import RecyclingSubmission
from app.models.scan_history import ScanHistory
from app.models.user import User
from app.schemas.profile import ProfileResponse, UpdateProfileRequest
from app.services.user_service import sync_user_level
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/profile", tags=["Profile"])

MATERIAL_FIELDS = [
    ("plastic_bottles", "plastic_bottles"),
    ("glass", "glass"),
    ("paper", "paper"),
    ("metal_cans", "metal_cans"),
    ("batteries", "batteries"),
    ("electronics", "electronics"),
    ("cardboard", "cardboard"),
    ("other_recyclable", "other_recyclable"),
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize_profile(user: User, db: Session) -> ProfileResponse:
    user = sync_user_level(db, user)
    submissions = (
        db.query(RecyclingSubmission)
        .filter(RecyclingSubmission.user_id == user.id)
        .order_by(RecyclingSubmission.created_at.desc())
        .all()
    )

    material_totals = {key: 0 for key, _ in MATERIAL_FIELDS}
    recent_activity = []

    for submission in submissions:
        submission_materials: list[tuple[str, int]] = []
        for key, field_name in MATERIAL_FIELDS:
            value = int(getattr(submission, field_name, 0) or 0)
            material_totals[key] += value
            if value > 0:
                submission_materials.append((key, value))

        point = (
            db.query(RecyclingPoint)
            .filter(RecyclingPoint.id == submission.recycling_point_id)
            .first()
        )
        point_name = point.name if point else "Unknown"

        for key, quantity in submission_materials:
            recent_activity.append(
                {
                    "id": int(submission.id),
                    "created_at": submission.created_at.isoformat(),
                    "recycling_point_name": point_name,
                    "material": key,
                    "quantity": quantity,
                    "eco_points_awarded": int(submission.total_points_awarded or 0),
                }
            )

    materials = [
        {"key": key, "quantity": int(quantity)}
        for key, quantity in material_totals.items()
        if int(quantity) > 0
    ]

    return ProfileResponse(
        id=int(user.id),
        full_name=str(user.full_name or "Unknown"),
        email=str(user.email or ""),
        city=str(user.city or "Unknown"),
        user_type=str(getattr(user, "user_type", "") or ""),
        institution=str(getattr(user, "institution", "") or ""),
        eco_points=int(user.eco_points or 0),
        level=int(user.level or 1),
        streak=int(user.streak or 0),
        total_scans=int(user.total_scans or 0),
        analytics={
            "total_recycling_actions": len(submissions),
            "total_eco_points_earned": int(user.eco_points or 0),
            "materials": materials,
            "recent_activity": recent_activity[:8],
        },
    )


def _validate_city(city: str) -> str:
    normalized_city = city.strip()
    if not normalized_city:
        raise HTTPException(status_code=400, detail="CITY_REQUIRED")

    if normalized_city.lower() == "unknown":
        raise HTTPException(status_code=400, detail="CITY_REQUIRED")

    return normalized_city


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _serialize_profile(user, db)


@router.patch("/{user_id}", response_model=ProfileResponse)
def update_profile(
    user_id: int,
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = False

    if payload.city is not None:
        user.city = _validate_city(payload.city)
        updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="NO_PROFILE_FIELDS_TO_UPDATE")

    db.add(user)
    db.commit()
    db.refresh(user)

    return _serialize_profile(user, db)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.query(ScanHistory).filter(ScanHistory.user_id == user_id).delete()
    db.query(RecyclingSubmission).filter(
        RecyclingSubmission.user_id == user_id
    ).delete()
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/public/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = sync_user_level(db, user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "city": user.city,
        "eco_points": user.eco_points,
        "level": user.level,
        "streak": user.streak,
        "total_scans": user.total_scans,
    }
