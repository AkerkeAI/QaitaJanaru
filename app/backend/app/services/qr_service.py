from __future__ import annotations

import base64
import io
import zipfile
from datetime import datetime, timedelta
from typing import Any, Dict, List

import segno
from app.models.qr_claim import QrClaim
from app.models.recycling_point import RecyclingPoint
from app.models.recycling_submission import RecyclingSubmission
from app.models.user import User
from app.schemas.qr import RecyclingSubmissionQuantities
from app.services.progression_service import apply_recycling_action_progression
from app.services.recycling_points_seed import build_qr_identifier
from sqlalchemy.orm import Session

QR_BASE_URL = "https://qaita-janaru.vercel.app/qr"
RECYCLING_POINT_COOLDOWN_HOURS = 24
RECYCLING_REWARD_TABLE = {
    "plastic_bottles": 2,
    "glass": 3,
    "paper": 1,
    "metal_cans": 3,
    "batteries": 8,
    "electronics": 15,
    "cardboard": 2,
    "other_recyclable": 1,
}


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


def _escape_xml(value: str | None) -> str:
    if not value:
        return ""
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def build_poster_svg(point: RecyclingPoint) -> str:
    qr_svg = build_qr_svg(point)
    qr_data_uri = (
        "data:image/svg+xml;base64,"
        + base64.b64encode(qr_svg.encode("utf-8")).decode("ascii")
    )

    width = 2480
    height = 3508
    qr_size = 900
    qr_x = (width - qr_size) / 2
    qr_y = 1200

    title = _escape_xml("QaitaJanaru")
    point_name = _escape_xml(point.name or "Recycling Point")
    city = _escape_xml(point.city or "")
    address = _escape_xml(point.address or "")

    return f'''<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#0d4a2f" />
  <rect x="120" y="120" width="{width - 240}" height="{height - 240}" rx="48" fill="#ffffff" stroke="#d9f99d" stroke-width="8" />
  <rect x="160" y="160" width="{width - 320}" height="250" rx="32" fill="#0f766e" />
  <text x="220" y="250" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="90" font-weight="700">Qaita Janaru</text>
  <text x="220" y="320" fill="#d1fae5" font-family="Arial, Helvetica, sans-serif" font-size="36">Каждый QR ведёт к пункту переработки</text>

  <g>
    <rect x="220" y="520" width="{width - 440}" height="2300" rx="42" fill="#f9fafb" stroke="#e7f5db" stroke-width="5" />
    <text x="300" y="630" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="800">{point_name}</text>
    <text x="300" y="705" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="36">{city}</text>
    <text x="300" y="760" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="36">{address}</text>

    <rect x="280" y="860" width="{width - 560}" height="1420" rx="36" fill="#facc15" />
    <rect x="360" y="940" width="{width - 720}" height="1260" rx="34" fill="#ffffff" stroke="#f59e0b" stroke-width="6" />
    <text x="420" y="1020" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700">Отсканируйте QR-код</text>
    <text x="420" y="1088" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="30">Откройте страницу подтверждения и продолжите переработку</text>
    <text x="420" y="1138" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="30">без повторного сканирования</text>

    <rect x="{qr_x - 20}" y="{qr_y - 20}" width="{qr_size + 40}" height="{qr_size + 40}" rx="36" fill="#ffffff" opacity="0.85" />
    <image href="{qr_data_uri}" x="{qr_x}" y="{qr_y}" width="{qr_size}" height="{qr_size}" preserveAspectRatio="xMidYMid meet" />
  </g>

  <rect x="300" y="2980" width="{width - 600}" height="340" rx="30" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="6" />
  <text x="360" y="3060" fill="#065f46" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700">Спасибо за участие в QaitaJanaru</text>
  <text x="360" y="3135" fill="#047857" font-family="Arial, Helvetica, sans-serif" font-size="30">Пожалуйста, покажите этот постер на пункте переработки</text>
</svg>'''


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
    return {
        "success": False,
        "message": "Legacy QR instant claim is disabled",
        "recycling_point_id": None,
        "recycling_point_name": None,
        "qr_identifier": qr_identifier,
        "points_awarded": 0,
        "eco_points": 0,
        "task_rewards": 0,
        "total_reward": 0,
    }


def calculate_recycling_reward(quantities: RecyclingSubmissionQuantities) -> int:
    payload = quantities.model_dump()
    total = 0
    for key, points_per_unit in RECYCLING_REWARD_TABLE.items():
        total += max(0, int(payload.get(key, 0) or 0)) * points_per_unit
    return total


def _find_recent_submission(
    db: Session, user_id: int, recycling_point_id: int
) -> RecyclingSubmission | None:
    threshold = datetime.utcnow() - timedelta(hours=RECYCLING_POINT_COOLDOWN_HOURS)
    return (
        db.query(RecyclingSubmission)
        .filter(
            RecyclingSubmission.user_id == user_id,
            RecyclingSubmission.recycling_point_id == recycling_point_id,
            RecyclingSubmission.created_at >= threshold,
        )
        .order_by(RecyclingSubmission.created_at.desc())
        .first()
    )


def submit_recycling_confirmation(
    db: Session,
    user_id: int,
    qr_identifier: str,
    quantities: RecyclingSubmissionQuantities,
) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "success": False,
            "message": "User not found",
            "recycling_point_id": None,
            "recycling_point_name": None,
            "qr_identifier": None,
            "submitted_quantities": quantities,
            "recycling_reward": 0,
            "task_rewards": 0,
            "total_reward": 0,
            "eco_points": 0,
            "daily_task_rewards": 0,
            "weekly_task_rewards": 0,
            "auto_claimed_task_ids": [],
        }

    point = get_point_by_qr_identifier(db, qr_identifier)
    if not point:
        return {
            "success": False,
            "message": "QR code not found",
            "recycling_point_id": None,
            "recycling_point_name": None,
            "qr_identifier": qr_identifier,
            "submitted_quantities": quantities,
            "recycling_reward": 0,
            "task_rewards": 0,
            "total_reward": 0,
            "eco_points": int(user.eco_points or 0),
            "daily_task_rewards": 0,
            "weekly_task_rewards": 0,
            "auto_claimed_task_ids": [],
        }

    recent_submission = _find_recent_submission(db, user_id, int(point.id))
    if recent_submission:
        return {
            "success": False,
            "message": "You already submitted recycling for this location today.",
            "recycling_point_id": int(point.id),
            "recycling_point_name": point.name,
            "qr_identifier": point.qr_identifier,
            "submitted_quantities": quantities,
            "recycling_reward": 0,
            "task_rewards": 0,
            "total_reward": 0,
            "eco_points": int(user.eco_points or 0),
            "daily_task_rewards": 0,
            "weekly_task_rewards": 0,
            "auto_claimed_task_ids": [],
        }

    recycling_reward = calculate_recycling_reward(quantities)
    if recycling_reward <= 0:
        return {
            "success": False,
            "message": "Add at least one recycled item.",
            "recycling_point_id": int(point.id),
            "recycling_point_name": point.name,
            "qr_identifier": point.qr_identifier,
            "submitted_quantities": quantities,
            "recycling_reward": 0,
            "task_rewards": 0,
            "total_reward": 0,
            "eco_points": int(user.eco_points or 0),
            "daily_task_rewards": 0,
            "weekly_task_rewards": 0,
            "auto_claimed_task_ids": [],
        }

    progression = apply_recycling_action_progression(
        db,
        user,
        earned_points=recycling_reward,
        scan_increment=1,
    )
    user = progression["user"]

    quantity_data = quantities.model_dump()
    db.add(
        RecyclingSubmission(
            user_id=user_id,
            recycling_point_id=int(point.id),
            plastic_bottles=int(quantity_data["plastic_bottles"]),
            glass=int(quantity_data["glass"]),
            paper=int(quantity_data["paper"]),
            metal_cans=int(quantity_data["metal_cans"]),
            batteries=int(quantity_data["batteries"]),
            electronics=int(quantity_data["electronics"]),
            cardboard=int(quantity_data["cardboard"]),
            other_recyclable=int(quantity_data["other_recyclable"]),
            total_points_awarded=int(progression["total_reward"]),
        )
    )
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Recycling confirmed successfully",
        "recycling_point_id": int(point.id),
        "recycling_point_name": point.name,
        "qr_identifier": point.qr_identifier,
        "submitted_quantities": quantities,
        "recycling_reward": int(recycling_reward),
        "task_rewards": int(progression["task_rewards"]),
        "total_reward": int(progression["total_reward"]),
        "eco_points": int(user.eco_points or 0),
        "daily_task_rewards": int(progression["daily_task_rewards"]),
        "weekly_task_rewards": int(progression["weekly_task_rewards"]),
        "auto_claimed_task_ids": list(progression["auto_claimed_task_ids"]),
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
