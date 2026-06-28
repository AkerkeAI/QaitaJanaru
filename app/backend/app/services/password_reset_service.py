import logging
import random
from datetime import datetime, timedelta

from app.core.security import (
    hash_password,
    hash_reset_code,
    verify_password,
    verify_reset_code,
)
from app.models.password_reset_code import PasswordResetCode
from app.models.user import User
from app.services.email_service import send_password_reset_code
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

RESET_CODE_EXPIRATION_MINUTES = 10
REQUEST_COOLDOWN_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 3
REQUEST_WINDOW_MINUTES = 10
GENERIC_RESET_RESPONSE = (
    "If an account with this email exists, a verification code has been sent."
)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def generate_verification_code() -> str:
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def invalidate_latest_codes(db: Session, email: str) -> None:
    _ = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.email == email,
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.invalidated.is_(False),
        )
        .update({PasswordResetCode.invalidated: True}, synchronize_session=False)
    )


def create_password_reset_request(
    db: Session, email: str, request_ip: str | None = None
) -> str:
    normalized_email = normalize_email(email)
    logger.info(
        "[forgot-password] forgot password request received. email=%s request_ip=%s",
        normalized_email,
        request_ip,
    )
    now = datetime.now()
    window_start = now - timedelta(minutes=REQUEST_WINDOW_MINUTES)
    recent_requests = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.email == normalized_email,
            PasswordResetCode.created_at >= window_start,
        )
        .count()
    )

    logger.info(
        "[forgot-password] recent reset request count computed. email=%s count=%s window_minutes=%s",
        normalized_email,
        recent_requests,
        REQUEST_WINDOW_MINUTES,
    )

    if recent_requests >= MAX_REQUESTS_PER_WINDOW:
        logger.warning(
            "[forgot-password] request throttled by max requests window. email=%s count=%s",
            normalized_email,
            recent_requests,
        )
        return GENERIC_RESET_RESPONSE

    latest_request = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.email == normalized_email)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    latest_request_created_at = (
        latest_request.created_at if latest_request is not None else None
    )
    if (
        latest_request_created_at is not None
        and (now - latest_request_created_at).total_seconds() < REQUEST_COOLDOWN_SECONDS
    ):
        logger.warning(
            "[forgot-password] request throttled by cooldown. email=%s cooldown_seconds=%s",
            normalized_email,
            REQUEST_COOLDOWN_SECONDS,
        )
        return GENERIC_RESET_RESPONSE

    user = db.query(User).filter(User.email == normalized_email).first()
    logger.info(
        "[forgot-password] user lookup completed. email=%s user_found=%s user_id=%s",
        normalized_email,
        bool(user),
        getattr(user, "id", None),
    )

    logger.info(
        "[forgot-password] invalidating previous reset codes. email=%s",
        normalized_email,
    )
    invalidate_latest_codes(db, normalized_email)
    logger.info(
        "[forgot-password] previous reset codes invalidated. email=%s", normalized_email
    )

    code = generate_verification_code()
    logger.info(
        "[forgot-password] reset code generated. email=%s code_length=%s",
        normalized_email,
        len(code),
    )
    reset_code = PasswordResetCode(
        user_id=user.id if user else None,
        email=normalized_email,
        code_hash=hash_reset_code(code),
        expires_at=now + timedelta(minutes=RESET_CODE_EXPIRATION_MINUTES),
        request_ip=request_ip,
    )
    logger.info(
        "[forgot-password] saving password reset record. email=%s", normalized_email
    )
    db.add(reset_code)
    db.commit()
    logger.info(
        "[forgot-password] password reset record saved. email=%s reset_record_id=%s user_id=%s",
        normalized_email,
        getattr(reset_code, "id", None),
        getattr(user, "id", None),
    )

    if user:
        logger.info(
            "[forgot-password] email_service.send_password_reset_code() will be called. email=%s user_id=%s",
            normalized_email,
            getattr(user, "id", None),
        )
        send_password_reset_code(normalized_email, code)
        logger.info(
            "[forgot-password] email_service.send_password_reset_code() completed without exception. email=%s",
            normalized_email,
        )
    else:
        logger.warning(
            "[forgot-password] early stop before sending because no user matched normalized email. email=%s",
            normalized_email,
        )

    logger.info(
        "[forgot-password] create_password_reset_request returning generic response. email=%s",
        normalized_email,
    )
    return GENERIC_RESET_RESPONSE


def verify_password_reset_code(db: Session, email: str, code: str) -> bool:
    normalized_email = normalize_email(email)
    latest_code = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.email == normalized_email)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )

    if not latest_code:
        return False

    latest_code_invalidated = bool(getattr(latest_code, "invalidated", False))
    latest_code_used_at = getattr(latest_code, "used_at", None)
    latest_code_expires_at = getattr(latest_code, "expires_at", None)
    latest_code_hash = getattr(latest_code, "code_hash", "")

    if latest_code_invalidated or latest_code_used_at is not None:
        return False

    if latest_code_expires_at is None:
        return False

    if latest_code_expires_at < datetime.now():
        return False

    return verify_reset_code(code, str(latest_code_hash))


def reset_password_with_code(
    db: Session, email: str, code: str, new_password: str
) -> bool:
    normalized_email = normalize_email(email)
    latest_code = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.email == normalized_email)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )

    if not latest_code:
        return False

    latest_code_invalidated = bool(getattr(latest_code, "invalidated", False))
    latest_code_used_at = getattr(latest_code, "used_at", None)
    latest_code_expires_at = getattr(latest_code, "expires_at", None)
    latest_code_hash = getattr(latest_code, "code_hash", "")

    if latest_code_invalidated or latest_code_used_at is not None:
        return False

    if latest_code_expires_at is None:
        return False

    if latest_code_expires_at < datetime.now():
        return False

    if not verify_reset_code(code, str(latest_code_hash)):
        return False

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        setattr(latest_code, "used_at", datetime.now())
        db.add(latest_code)
        db.commit()
        return True

    setattr(user, "password", hash_password(new_password))
    setattr(latest_code, "used_at", datetime.now())

    db.add(user)
    db.add(latest_code)
    db.commit()
    return True


def verify_and_upgrade_user_password(db: Session, user: User, password: str) -> bool:
    stored_password = str(getattr(user, "password", ""))
    if verify_password(password, stored_password):
        if not stored_password.startswith("pbkdf2_sha256$"):
            setattr(user, "password", hash_password(password))
            db.add(user)
            db.commit()
            db.refresh(user)
        return True

    return False
