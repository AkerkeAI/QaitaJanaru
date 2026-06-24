from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from sqlalchemy import func

router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/global")
def global_leaderboard(db: Session = Depends(get_db)):

    users = (
        db.query(User)
        .order_by(User.eco_points.desc())
        .all()
    )

    result = []

    for position, user in enumerate(users, start=1):
        result.append({
            "rank": position,
            "user_id": user.id,
            "full_name": user.full_name,
            "city": user.city,
            "eco_points": user.eco_points
        })

    return result

@router.get("/cities")
def city_leaderboard(db: Session = Depends(get_db)):

    cities = (
        db.query(
            User.city,
            func.sum(User.eco_points).label("points")
        )
        .group_by(User.city)
        .order_by(func.sum(User.eco_points).desc())
        .all()
    )

    result = []

    for rank, city in enumerate(cities, start=1):
        result.append({
            "rank": rank,
            "city": city.city,
            "eco_points": city.points
        })

    return result


@router.get("/city/{city_name}")
def city_users_leaderboard(city_name: str, db: Session = Depends(get_db)):

    users = (
        db.query(User)
        .filter(User.city.ilike(city_name))
        .order_by(User.eco_points.desc())
        .all()
    )

    result = []

    for position, user in enumerate(users, start=1):
        result.append({
            "rank": position,
            "user_id": user.id,
            "full_name": user.full_name,
            "city": user.city,
            "eco_points": user.eco_points,
            "level": user.level,
            "streak": user.streak,
            "total_scans": user.total_scans
        })

    return result