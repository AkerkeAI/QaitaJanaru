from __future__ import annotations

import json
from pathlib import Path

from app.models.recycling_point import RecyclingPoint
from app.models.recycling_submission import RecyclingSubmission

SEED_DATA_PATH = Path(__file__).with_name("recycling_points_seed.json")
SEED_RECYCLING_POINTS = json.loads(SEED_DATA_PATH.read_text(encoding="utf-8"))


def build_qr_identifier(point_id: int) -> str:
    return f"recycling-point-{point_id}"


def seed_recycling_points(db) -> None:
    seed_ids = set()

    for item in SEED_RECYCLING_POINTS:
        point_id = int(item["id"])
        seed_ids.add(point_id)
        existing = (
            db.query(RecyclingPoint).filter(RecyclingPoint.id == point_id).first()
        )

        if existing:
            existing.qr_identifier = build_qr_identifier(point_id)
            existing.name = item["name"]
            existing.city = item["city"]
            existing.address = item["address"]
            existing.latitude = item["latitude"]
            existing.longitude = item["longitude"]
            existing.description = item["description"]
            existing.waste_type = item["waste_type"]
            existing.facility_type = item["facility_type"]
            continue

        db.add(
            RecyclingPoint(
                id=point_id,
                qr_identifier=build_qr_identifier(point_id),
                name=item["name"],
                city=item["city"],
                address=item["address"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                description=item["description"],
                waste_type=item["waste_type"],
                facility_type=item["facility_type"],
            )
        )

    # Safely delete stale points by first removing any recycling_submissions that reference them
    stale_points = db.query(RecyclingPoint).all()
    for point in stale_points:
        if int(point.id) not in seed_ids:
            # First delete any recycling_submissions that reference this point
            db.query(RecyclingSubmission).filter(
                RecyclingSubmission.recycling_point_id == point.id
            ).delete()
            # Then delete the point itself
            db.delete(point)

    db.commit()
