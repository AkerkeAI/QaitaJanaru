from __future__ import annotations

import io
import uuid
import zipfile
from datetime import datetime, timedelta
from typing import Any

import segno
from PIL import Image
from app.models.partner_qr_branch import PartnerQrBranch
from app.models.partner_qr_branch_reward import PartnerQrBranchReward
from app.models.partner_qr_code import PartnerQrCode
from app.models.partner_qr_exchange import PartnerQrExchange
from app.models.partner_qr_partner import PartnerQrPartner
from app.models.partner_qr_receipt import PartnerQrReceipt
from app.models.partner_qr_reward import PartnerQrReward
from app.models.user import User
from app.services.qr_service import (
    POSTER_IMAGE_PATH,
    POSTER_QR_POSITION,
    POSTER_QR_SIZE,
)
from sqlalchemy.orm import Session

PARTNER_QR_BASE_URL = "https://qaita-janaru.vercel.app/partner-qr"
PARTNER_QR_RECEIPT_TTL_MINUTES = 10


def build_partner_qr_value(code: PartnerQrCode) -> str:
    return f"{PARTNER_QR_BASE_URL}/{code.qr_identifier}"


def _build_qr_code(code: PartnerQrCode):
    return segno.make(build_partner_qr_value(code), error="m", micro=False)


def build_partner_qr_svg(code: PartnerQrCode) -> str:
    qr = _build_qr_code(code)
    buffer = io.BytesIO()
    qr.save(buffer, kind="svg", scale=8, border=2, dark="#000000", light="#ffffff")
    return buffer.getvalue().decode("utf-8")


def build_partner_qr_png_bytes(code: PartnerQrCode) -> bytes:
    qr = _build_qr_code(code)
    buffer = io.BytesIO()
    qr.save(buffer, kind="png", scale=8, border=2, dark="#000000", light="#ffffff")
    return buffer.getvalue()


def build_partner_qr_poster_png_bytes(code: PartnerQrCode) -> bytes:
    if not POSTER_IMAGE_PATH.exists():
        raise FileNotFoundError(f"Poster image not found at {POSTER_IMAGE_PATH}")

    qr_buffer = io.BytesIO(build_partner_qr_png_bytes(code))
    qr_buffer.seek(0)

    with Image.open(qr_buffer) as qr_image:
        qr_image = qr_image.convert("RGBA")
        qr_image = qr_image.resize((POSTER_QR_SIZE, POSTER_QR_SIZE), Image.Resampling.LANCZOS)

        with Image.open(POSTER_IMAGE_PATH) as poster_image:
            poster_image = poster_image.convert("RGBA")
            poster_image.paste(qr_image, POSTER_QR_POSITION, qr_image)
            output_buffer = io.BytesIO()
            poster_image.save(output_buffer, format="PNG")
            return output_buffer.getvalue()


def _serialize_partner_qr_admin_item(
    code: PartnerQrCode,
    branch: PartnerQrBranch | None,
    partner: PartnerQrPartner | None,
) -> dict[str, Any]:
    return {
        "id": int(code.id),
        "qr_identifier": str(code.qr_identifier),
        "is_reserved": bool(code.is_reserved),
        "is_assigned": branch is not None,
        "branch_id": int(branch.id) if branch else None,
        "partner_name": str(partner.name) if partner else None,
        "branch_name": str(branch.name) if branch else None,
        "city": str(branch.city) if branch else None,
        "address": str(branch.address) if branch else None,
        "qr_url": build_partner_qr_value(code),
        "qr_value": build_partner_qr_value(code),
        "qr_svg": build_partner_qr_svg(code),
    }


def list_partner_qr_codes(db: Session) -> list[dict[str, Any]]:
    codes = db.query(PartnerQrCode).order_by(PartnerQrCode.id.asc()).all()
    items: list[dict[str, Any]] = []
    for code in codes:
        branch = None
        partner = None
        if code.assigned_branch_id is not None:
            branch = (
                db.query(PartnerQrBranch)
                .filter(PartnerQrBranch.id == code.assigned_branch_id)
                .first()
            )
            if branch:
                partner = (
                    db.query(PartnerQrPartner)
                    .filter(PartnerQrPartner.id == branch.partner_id)
                    .first()
                )
        items.append(_serialize_partner_qr_admin_item(code, branch, partner))
    return items


def get_partner_qr_code_by_id(db: Session, code_id: int) -> PartnerQrCode | None:
    return db.query(PartnerQrCode).filter(PartnerQrCode.id == code_id).first()


def get_partner_qr_code_by_identifier(
    db: Session,
    qr_identifier: str,
) -> PartnerQrCode | None:
    return (
        db.query(PartnerQrCode)
        .filter(PartnerQrCode.qr_identifier == qr_identifier)
        .first()
    )


def _get_branch_with_partner_for_code(
    db: Session, qr_identifier: str
) -> tuple[PartnerQrCode, PartnerQrBranch, PartnerQrPartner] | tuple[None, None, None]:
    code = get_partner_qr_code_by_identifier(db, qr_identifier)
    if not code or code.assigned_branch_id is None:
        return None, None, None

    branch = (
        db.query(PartnerQrBranch)
        .filter(PartnerQrBranch.id == code.assigned_branch_id)
        .first()
    )
    if not branch:
        return None, None, None

    partner = (
        db.query(PartnerQrPartner)
        .filter(PartnerQrPartner.id == branch.partner_id)
        .first()
    )
    if not partner:
        return None, None, None

    return code, branch, partner


def get_partner_qr_branch_details(
    db: Session,
    qr_identifier: str,
) -> dict[str, Any] | None:
    code, branch, partner = _get_branch_with_partner_for_code(db, qr_identifier)
    if not code or not branch or not partner:
        return None

    reward_links = (
        db.query(PartnerQrBranchReward)
        .filter(PartnerQrBranchReward.branch_id == branch.id)
        .order_by(PartnerQrBranchReward.id.asc())
        .all()
    )
    rewards: list[dict[str, Any]] = []
    for link in reward_links:
        reward = (
            db.query(PartnerQrReward)
            .filter(PartnerQrReward.id == link.reward_id)
            .first()
        )
        if not reward:
            continue
        rewards.append(
            {
                "id": str(reward.id),
                "title": str(reward.title),
                "description": str(reward.description),
                "eco_points_required": int(reward.eco_points_required),
                "image": str(reward.image),
                "category_id": str(reward.category_id),
            }
        )

    return {
        "qr_identifier": str(code.qr_identifier),
        "partner_name": str(partner.name),
        "branch_name": str(branch.name),
        "city": str(branch.city),
        "address": str(branch.address),
        "instagram": str(branch.instagram or ""),
        "working_hours": str(branch.working_hours or ""),
        "lat": float(branch.lat) if branch.lat is not None else None,
        "lng": float(branch.lng) if branch.lng is not None else None,
        "rewards": rewards,
    }


def _build_receipt_payload(receipt: PartnerQrReceipt, exchange: PartnerQrExchange) -> dict[str, Any]:
    now = datetime.utcnow()
    is_expired = receipt.expires_at <= now
    is_used = receipt.used_at is not None
    return {
        "receipt_id": str(receipt.id),
        "exchange_id": int(exchange.id),
        "partner_name": str(receipt.partner_name),
        "branch_name": str(receipt.branch_name),
        "reward_title": str(receipt.reward_title),
        "price_eco_points": int(receipt.eco_points_spent),
        "eco_points_balance": int(exchange.eco_points_balance_after),
        "issued_at": receipt.issued_at.isoformat(),
        "expires_at": receipt.expires_at.isoformat(),
        "used_at": receipt.used_at.isoformat() if receipt.used_at else None,
        "is_expired": is_expired,
        "is_used": is_used,
        "is_valid": not is_expired and not is_used,
        "message": "Show this receipt to the cashier to receive your reward.",
    }


def exchange_partner_reward(
    db: Session,
    user_id: int,
    qr_identifier: str,
    reward_id: str,
) -> dict[str, Any]:
    code, branch, partner = _get_branch_with_partner_for_code(db, qr_identifier)
    if not code or not branch or not partner:
        raise ValueError("PARTNER_QR_NOT_FOUND")

    reward_link = (
        db.query(PartnerQrBranchReward)
        .filter(
            PartnerQrBranchReward.branch_id == branch.id,
            PartnerQrBranchReward.reward_id == reward_id,
        )
        .first()
    )
    if not reward_link:
        raise ValueError("REWARD_NOT_AVAILABLE_FOR_BRANCH")

    reward = db.query(PartnerQrReward).filter(PartnerQrReward.id == reward_id).first()
    if not reward:
        raise ValueError("REWARD_NOT_FOUND")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("USER_NOT_FOUND")

    current_points = int(user.eco_points or 0)
    required_points = int(reward.eco_points_required or 0)
    if current_points < required_points:
        raise ValueError("INSUFFICIENT_ECO_POINTS")

    user.eco_points = current_points - required_points
    db.add(user)
    db.flush()

    exchange = PartnerQrExchange(
        user_id=user_id,
        branch_id=branch.id,
        reward_id=str(reward.id),
        qr_code_id=code.id,
        status="completed",
        eco_points_spent=required_points,
        eco_points_balance_after=int(user.eco_points or 0),
    )
    db.add(exchange)
    db.flush()

    receipt = PartnerQrReceipt(
        id=uuid.uuid4().hex,
        exchange_id=exchange.id,
        user_id=user_id,
        partner_name=str(partner.name),
        branch_name=str(branch.name),
        reward_title=str(reward.title),
        eco_points_spent=required_points,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(minutes=PARTNER_QR_RECEIPT_TTL_MINUTES),
    )
    db.add(receipt)
    db.commit()
    db.refresh(exchange)
    db.refresh(receipt)

    return _build_receipt_payload(receipt, exchange)


def get_partner_qr_receipt(
    db: Session,
    receipt_id: str,
    user_id: int,
) -> dict[str, Any] | None:
    receipt = (
        db.query(PartnerQrReceipt)
        .filter(PartnerQrReceipt.id == receipt_id)
        .first()
    )
    if not receipt:
        return None
    if int(receipt.user_id) != int(user_id):
        raise PermissionError("RECEIPT_ACCESS_DENIED")

    exchange = (
        db.query(PartnerQrExchange)
        .filter(PartnerQrExchange.id == receipt.exchange_id)
        .first()
    )
    if not exchange:
        return None

    return _build_receipt_payload(receipt, exchange)


def build_all_partner_qr_zip(db: Session) -> bytes:
    codes = db.query(PartnerQrCode).order_by(PartnerQrCode.id.asc()).all()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for code in codes:
            qr_svg = build_partner_qr_svg(code)
            qr_png = build_partner_qr_png_bytes(code)
            base_name = f"partner-qr-{code.id}-{code.qr_identifier}"
            zip_file.writestr(f"{base_name}.svg", qr_svg)
            zip_file.writestr(f"{base_name}.png", qr_png)
    buffer.seek(0)
    return buffer.read()
