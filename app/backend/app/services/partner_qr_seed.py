from __future__ import annotations

from typing import Any

from app.models.partner_qr_branch import PartnerQrBranch
from app.models.partner_qr_branch_reward import PartnerQrBranchReward
from app.models.partner_qr_code import PartnerQrCode
from app.models.partner_qr_partner import PartnerQrPartner
from app.models.partner_qr_reward import PartnerQrReward

MIN_RESERVED_PARTNER_QR_CODES = 20

SEED_REWARDS: list[dict[str, Any]] = [
    {
        "id": "partner-reward-coffee",
        "title": "10% off Coffee",
        "description": "Get 10% off your coffee purchase",
        "eco_points_required": 300,
        "image": "☕",
        "category_id": "drinks",
    },
    {
        "id": "partner-reward-lemonade",
        "title": "10% off Lemonade",
        "description": "Get 10% off your lemonade purchase",
        "eco_points_required": 300,
        "image": "🍋",
        "category_id": "drinks",
    },
    {
        "id": "partner-reward-limonade",
        "title": "10% off Lemonade",
        "description": "Get 10% off your lemonade purchase",
        "eco_points_required": 300,
        "image": "🍋",
        "category_id": "drinks",
    },
    {
        "id": "partner-reward-bubble-tea",
        "title": "10% off Bubble Tea",
        "description": "Get 10% off your bubble tea purchase",
        "eco_points_required": 300,
        "image": "🧋",
        "category_id": "drinks",
    },
    {
        "id": "partner-reward-cocktail",
        "title": "10% off Cocktails",
        "description": "Get 10% off your cocktail purchase",
        "eco_points_required": 300,
        "image": "🍸",
        "category_id": "drinks",
    },
    {
        "id": "partner-reward-ice-cream",
        "title": "10% off Ice Cream",
        "description": "Get 10% off your ice cream purchase",
        "eco_points_required": 300,
        "image": "🍦",
        "category_id": "desserts",
    },
]

SEED_PARTNERS: list[dict[str, Any]] = [
    {
        "name": "Nagi Coffee Bar",
        "branch": {
            "name": "33-181 Hypermarket Dina",
            "city": "Aktau",
            "address": "33-181, Inside Dina Hypermarket, Aktau",
            "instagram": "@nagimoko_ice",
            "working_hours": "11:00 - 22:00",
            "lat": 43.6522,
            "lng": 51.1577,
        },
        "reward_ids": [
            "partner-reward-coffee",
            "partner-reward-lemonade",
        ],
    },
    {
        "name": "Nagimoko Ice",
        "branch": {
            "name": "TC Astana, 15th district",
            "city": "Aktau",
            "address": "Shopping Center Astana, 15th Microdistrict, Kiosk, Aktau",
            "instagram": "@nagimoko_ice",
            "working_hours": "16:00 - 01:00",
            "lat": 43.6418,
            "lng": 51.1805,
        },
        "reward_ids": [
            "partner-reward-ice-cream",
            "partner-reward-bubble-tea",
            "partner-reward-cocktail",
            "partner-reward-lemonade",
        ],
    },
]


def build_partner_qr_identifier(sequence_number: int) -> str:
    return f"partner-qr-{sequence_number:04d}"


def _get_or_create_partner(db, partner_name: str) -> PartnerQrPartner:
    partner = (
        db.query(PartnerQrPartner)
        .filter(PartnerQrPartner.name == partner_name)
        .first()
    )
    if partner:
        return partner

    partner = PartnerQrPartner(name=partner_name)
    db.add(partner)
    db.flush()
    return partner


def _get_or_create_branch(db, partner: PartnerQrPartner, branch_data: dict[str, Any]) -> PartnerQrBranch:
    branch = (
        db.query(PartnerQrBranch)
        .filter(
            PartnerQrBranch.partner_id == partner.id,
            PartnerQrBranch.city == str(branch_data["city"]),
            PartnerQrBranch.address == str(branch_data["address"]),
        )
        .first()
    )

    if not branch:
        branch = PartnerQrBranch(partner_id=partner.id, **branch_data)
        db.add(branch)
        db.flush()
        return branch

    branch.name = str(branch_data["name"])
    branch.city = str(branch_data["city"])
    branch.address = str(branch_data["address"])
    branch.instagram = branch_data.get("instagram")
    branch.working_hours = branch_data.get("working_hours")
    branch.lat = branch_data.get("lat")
    branch.lng = branch_data.get("lng")
    db.add(branch)
    db.flush()
    return branch


def ensure_reserved_partner_qr_pool(
    db,
    minimum_reserved: int = MIN_RESERVED_PARTNER_QR_CODES,
) -> None:
    reserved_count = (
        db.query(PartnerQrCode)
        .filter(PartnerQrCode.assigned_branch_id.is_(None))
        .count()
    )
    existing_total = db.query(PartnerQrCode).count()

    for offset in range(minimum_reserved - reserved_count):
        sequence_number = existing_total + offset + 1
        db.add(
            PartnerQrCode(
                qr_identifier=build_partner_qr_identifier(sequence_number),
                assigned_branch_id=None,
                is_reserved=True,
            )
        )

    if minimum_reserved > reserved_count:
        db.flush()


def assign_next_available_partner_qr_code(db, branch: PartnerQrBranch) -> PartnerQrCode:
    existing_code = (
        db.query(PartnerQrCode)
        .filter(PartnerQrCode.assigned_branch_id == branch.id)
        .first()
    )
    if existing_code:
        ensure_reserved_partner_qr_pool(db)
        return existing_code

    available_code = (
        db.query(PartnerQrCode)
        .filter(PartnerQrCode.assigned_branch_id.is_(None))
        .order_by(PartnerQrCode.id.asc())
        .first()
    )
    if not available_code:
        ensure_reserved_partner_qr_pool(db, minimum_reserved=1)
        available_code = (
            db.query(PartnerQrCode)
            .filter(PartnerQrCode.assigned_branch_id.is_(None))
            .order_by(PartnerQrCode.id.asc())
            .first()
        )

    if not available_code:
        raise RuntimeError("Unable to allocate partner QR code")

    available_code.assigned_branch_id = branch.id
    available_code.is_reserved = True
    db.add(available_code)
    db.flush()

    ensure_reserved_partner_qr_pool(db)
    return available_code


def seed_partner_qr_data(db) -> None:
    for reward_data in SEED_REWARDS:
        reward = (
            db.query(PartnerQrReward)
            .filter(PartnerQrReward.id == reward_data["id"])
            .first()
        )
        if not reward:
            reward = PartnerQrReward(**reward_data)
            db.add(reward)
            continue

        reward.title = str(reward_data["title"])
        reward.description = str(reward_data["description"])
        reward.eco_points_required = int(reward_data["eco_points_required"])
        reward.image = str(reward_data["image"])
        reward.category_id = str(reward_data["category_id"])
        db.add(reward)

    db.flush()

    active_branch_ids: set[int] = set()

    for partner_data in SEED_PARTNERS:
        partner = _get_or_create_partner(db, str(partner_data["name"]))
        branch = _get_or_create_branch(db, partner, dict(partner_data["branch"]))
        active_branch_ids.add(int(branch.id))
        assign_next_available_partner_qr_code(db, branch)

        expected_reward_ids = {str(reward_id) for reward_id in partner_data["reward_ids"]}
        existing_links = (
            db.query(PartnerQrBranchReward)
            .filter(PartnerQrBranchReward.branch_id == branch.id)
            .all()
        )
        existing_reward_ids = {str(link.reward_id) for link in existing_links}

        for reward_id in expected_reward_ids - existing_reward_ids:
            db.add(
                PartnerQrBranchReward(branch_id=branch.id, reward_id=reward_id)
            )

        for link in existing_links:
            if str(link.reward_id) not in expected_reward_ids:
                db.delete(link)

    orphan_codes = (
        db.query(PartnerQrCode)
        .filter(PartnerQrCode.assigned_branch_id.is_not(None))
        .all()
    )
    for code in orphan_codes:
        if int(code.assigned_branch_id) not in active_branch_ids:
            code.assigned_branch_id = None
            code.is_reserved = True
            db.add(code)

    ensure_reserved_partner_qr_pool(db)
    db.commit()
