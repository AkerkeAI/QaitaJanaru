from __future__ import annotations

import io
import zipfile
from typing import Any, Dict, List

import segno
from app.models.qr_claim import QrClaim
from app.models.recycling_point import RecyclingPoint
from app.models.user import User
from app.services.recycling_points_seed import build_qr_identifier
from app.services.task_service import auto_claim_completed_tasks
from sqlalchemy.orm import Session

QR_BASE_URL = "https://qaita-janaru.vercel.app/qr"
QR_REWARD_POINTS = 12


def build_qr_value(point: RecyclingPoint) -> str:
    return f"{QR_BASE_URL}/{point.id}"


def _build_qr_code(point: RecyclingPoint):
    return segno.make(build_qr_value(point), error="m", micro=False)


def build_qr_svg(point: RecyclingPoint) -> str:
    qr = _build_qr_code(point)
    buffer = io.BytesIO()
    qr.save(buffer, kind="svg", scale=8, border=2, dark="#000000", light="#ffffff")
    return buffer.getvalue().decode("utf-8")


def build_qr_png_bytes(point: RecyclingPoint) -> bytes:
    qr = _build_qr_code(point)
    buffer = io.BytesIO()
    qr.save(buffer, kind="png", scale=8, border=2, dark="#000000", light="#ffffff")
    return buffer.getvalue()


def serialize_point(point: RecyclingPoint) -> Dict[str, str | int]:
    return {
        "id": int(point.id),
        "qr_identifier": str(point.qr_identifier),
        "name": str(point.name),
        "city": str(point.city),
        "address": str(point.address),
        "waste_type": str(point.waste_type),
        "facility_type": str(point.facility_type),
        "qr_url": build_qr_value(point),
        "qr_value": build_qr_value(point),
        "qr_svg": build_qr_svg(point),
    }


def list_qr_points(db: Session) -> List[Dict[str, str | int]]:
    points = (
        db.query(RecyclingPoint)
        .order_by(RecyclingPoint.city.asc(), RecyclingPoint.name.asc())
        .all()
    )
    return [serialize_point(point) for point in points]


def get_point_by_qr_identifier(
    db: Session, qr_identifier: str
) -> RecyclingPoint | None:
    return (
        db.query(RecyclingPoint)
        .filter(RecyclingPoint.qr_identifier == qr_identifier)
        .first()
    )


def get_point_by_id(db: Session, point_id: int) -> RecyclingPoint | None:
    return db.query(RecyclingPoint).filter(RecyclingPoint.id == point_id).first()


def ensure_qr_identifier(point: RecyclingPoint) -> None:
    if not point.qr_identifier:
        point.qr_identifier = build_qr_identifier(int(point.id))


def claim_qr_reward(
    db: Session, user_id: int, qr_identifier: str
) -> Dict[str, int | str | bool | None]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "success": False,
            "message": "User not found",
            "recycling_point_id": None,
            "recycling_point_name": None,
            "qr_identifier": None,
            "points_awarded": 0,
            "eco_points": 0,
            "task_rewards": 0,
            "total_reward": 0,
        }

    point = get_point_by_qr_identifier(db, qr_identifier)
    if not point:
        return {
            "success": False,
            "message": "QR code not found",
            "recycling_point_id": None,
            "recycling_point_name": None,
            "qr_identifier": qr_identifier,
            "points_awarded": 0,
            "eco_points": int(user.eco_points or 0),
            "task_rewards": 0,
            "total_reward": 0,
        }

    existing_claim = (
        db.query(QrClaim)
        .filter(QrClaim.user_id == user_id, QrClaim.recycling_point_id == point.id)
        .first()
    )
    if existing_claim:
        return {
            "success": False,
            "message": "Reward for this recycling point was already claimed",
            "recycling_point_id": point.id,
            "recycling_point_name": point.name,
            "qr_identifier": point.qr_identifier,
            "points_awarded": 0,
            "eco_points": int(user.eco_points or 0),
            "task_rewards": 0,
            "total_reward": 0,
        }

    user.eco_points = int(user.eco_points or 0) + QR_REWARD_POINTS
    user.level = max(1, user.eco_points // 100 + 1)

    reward_summary = auto_claim_completed_tasks(user)
    total_reward = QR_REWARD_POINTS + int(reward_summary["task_rewards"])

    db.add(
        QrClaim(
            user_id=user_id,
            recycling_point_id=point.id,
            qr_identifier=point.qr_identifier,
            points_awarded=QR_REWARD_POINTS,
        )
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "QR reward claimed successfully",
        "recycling_point_id": point.id,
        "recycling_point_name": point.name,
        "qr_identifier": point.qr_identifier,
        "points_awarded": QR_REWARD_POINTS,
        "eco_points": int(user.eco_points or 0),
        "task_rewards": int(reward_summary["task_rewards"]),
        "total_reward": total_reward,
    }


def build_all_qr_zip(db: Session) -> bytes:
    points = db.query(RecyclingPoint).order_by(RecyclingPoint.id.asc()).all()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for point in points:
            qr_svg = build_qr_svg(point)
            qr_png = build_qr_png_bytes(point)
            base_name = f"qr-{point.id}-{point.qr_identifier}"
            zip_file.writestr(f"{base_name}.svg", qr_svg)
            zip_file.writestr(f"{base_name}.png", qr_png)
    buffer.seek(0)
    return buffer.read()
