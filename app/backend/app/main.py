from app.db.session import Base, SessionLocal, engine
from app.models.chat_message import ChatMessage  # noqa: F401
from app.models.partner_qr_branch import PartnerQrBranch  # noqa: F401
from app.models.partner_qr_branch_reward import PartnerQrBranchReward  # noqa: F401
from app.models.partner_qr_code import PartnerQrCode  # noqa: F401
from app.models.partner_qr_exchange import PartnerQrExchange  # noqa: F401
from app.models.partner_qr_partner import PartnerQrPartner  # noqa: F401
from app.models.partner_qr_receipt import PartnerQrReceipt  # noqa: F401
from app.models.partner_qr_reward import PartnerQrReward  # noqa: F401
from app.models.password_reset_code import PasswordResetCode  # noqa: F401
from app.models.qr_claim import QrClaim  # noqa: F401
from app.models.recycling_point import RecyclingPoint  # noqa: F401
from app.models.recycling_submission import RecyclingSubmission  # noqa: F401
from app.models.scan_history import ScanHistory  # noqa: F401
from app.models.user import User  # noqa: F401
from app.routers import (
    auth,
    chat,
    leaderboard,
    partner_qr,
    profile,
    qr,
    recycling_points,
    routing,
    scan,
    tasks,
)
from app.services.partner_qr_seed import seed_partner_qr_data
from app.services.recycling_points_seed import seed_recycling_points
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

app = FastAPI()


@app.on_event("startup")
def ensure_database_tables() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Automatic migration for phone authentication fields
        migrate_phone_fields(db)
        migrate_usage_limit_fields(db)
        seed_recycling_points(db)
        seed_partner_qr_data(db)
    finally:
        db.close()


def migrate_phone_fields(db) -> None:
    """
    Automatically add phone and phone_verified columns if they don't exist.
    This is idempotent and safe for both PostgreSQL and SQLite.
    """
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]

        # Add phone column if it doesn't exist
        if 'phone' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            db.commit()
            print("✓ Added phone column to users table")

        # Refresh inspector after first change
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]

        # Add phone_verified column if it doesn't exist
        if 'phone_verified' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE"))
            db.commit()
            print("✓ Added phone_verified column to users table")

    except Exception as e:
        print(f"Error during phone fields migration: {e}")
        db.rollback()


def migrate_usage_limit_fields(db) -> None:
    try:
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "scans_used_today" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN scans_used_today INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added scans_used_today column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "assistant_messages_today" not in columns:
            db.execute(
                text(
                    "ALTER TABLE users ADD COLUMN assistant_messages_today INTEGER DEFAULT 0"
                )
            )
            db.commit()
            print("✓ Added assistant_messages_today column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_limit_reset_date" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_limit_reset_date DATE"))
            db.commit()
            print("✓ Added last_limit_reset_date column to users table")

    except Exception as e:
        print(f"Error during usage limit fields migration: {e}")
        db.rollback()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(leaderboard.router)
app.include_router(scan.router)
app.include_router(chat.router)
app.include_router(routing.router)
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(qr.router)
app.include_router(partner_qr.router)
app.include_router(recycling_points.router)


@app.get("/")
def root():
    return {"message": "QaitaJanaru API работает"}
