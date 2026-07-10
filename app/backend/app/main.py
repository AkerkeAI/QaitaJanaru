from app.db.session import Base, SessionLocal, engine
from app.models.chat_message import ChatMessage  # noqa: F401
from app.models.partner_qr_analytics import PartnerQrAnalytics  # noqa: F401
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
def ensure_database_tables():
    print("========== STARTUP ==========")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("Database session created")

    migrate_phone_fields(db)
    print("phone migration done")

    migrate_usage_limit_fields(db)
    print("usage migration done")

    migrate_partner_analytics(db)
    print("partner analytics done")

    migrate_user_level_fields(db)
    print("user migration done")

    seed_recycling_points(db)
    print("recycling done")

    seed_partner_qr_data(db)
    print("partner seed done") -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Automatic migration for phone authentication fields
        migrate_phone_fields(db)
        migrate_usage_limit_fields(db)
        migrate_partner_analytics(db)
        migrate_user_level_fields(db)
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


def migrate_partner_analytics(db) -> None:
    """
    Initialize analytics records for existing partners.
    This is idempotent and safe for both PostgreSQL and SQLite.
    """
    try:
        from app.models.partner_qr_analytics import PartnerQrAnalytics
        from app.models.partner_qr_partner import PartnerQrPartner

        # Get all existing partners
        partners = db.query(PartnerQrPartner).all()

        for partner in partners:
            # Check if analytics record exists
            analytics = db.query(PartnerQrAnalytics).filter(
                PartnerQrAnalytics.partner_id == partner.id
            ).first()

            if not analytics:
                # Create analytics record for this partner
                new_analytics = PartnerQrAnalytics(
                    partner_id=partner.id,
                    qr_scans=0,
                    page_visits=0,
                    route_requests=0
                )
                db.add(new_analytics)
                db.commit()
                print(f"✓ Created analytics record for partner: {partner.name}")

        print("✅ Partner analytics migration completed")

    except Exception as e:
        print(f"Error during partner analytics migration: {e}")
        db.rollback()


def migrate_user_level_fields(db) -> None:
    """
    Automatically add ALL missing columns from User model to users table.
    This is idempotent and safe for both PostgreSQL and SQLite.
    """
    try:
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        # Check all User model columns one by one
        if "full_name" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
            db.commit()
            print("✓ Added full_name column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "email" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
            db.commit()
            print("✓ Added email column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "password" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN password VARCHAR"))
            db.commit()
            print("✓ Added password column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "phone" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            db.commit()
            print("✓ Added phone column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "phone_verified" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE"))
            db.commit()
            print("✓ Added phone_verified column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "age" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))
            db.commit()
            print("✓ Added age column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "city" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN city VARCHAR"))
            db.commit()
            print("✓ Added city column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "eco_points" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN eco_points INTEGER DEFAULT 50"))
            db.commit()
            print("✓ Added eco_points column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "level" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1"))
            db.commit()
            print("✓ Added level column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "level_progress_percent" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN level_progress_percent INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added level_progress_percent column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "total_experience" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN total_experience INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added total_experience column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "streak" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added streak column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "total_scans" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN total_scans INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added total_scans column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_login_date" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_login_date DATE"))
            db.commit()
            print("✓ Added last_login_date column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_seen_at" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_seen_at DATE"))
            db.commit()
            print("✓ Added last_seen_at column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_penalty_applied_date" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_penalty_applied_date DATE"))
            db.commit()
            print("✓ Added last_penalty_applied_date column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "task_progress" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN task_progress JSON"))
            db.commit()
            print("✓ Added task_progress column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "claimed_rewards" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN claimed_rewards JSON DEFAULT '[]'"))
            db.commit()
            print("✓ Added claimed_rewards column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "completed_daily_tasks" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN completed_daily_tasks JSON DEFAULT '[]'"))
            db.commit()
            print("✓ Added completed_daily_tasks column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "completed_weekly_tasks" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN completed_weekly_tasks JSON DEFAULT '[]'"))
            db.commit()
            print("✓ Added completed_weekly_tasks column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "completed_achievement_chapters" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN completed_achievement_chapters JSON DEFAULT '[]'"))
            db.commit()
            print("✓ Added completed_achievement_chapters column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_daily_reset" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_daily_reset TIMESTAMP"))
            db.commit()
            print("✓ Added last_daily_reset column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_weekly_reset" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_weekly_reset TIMESTAMP"))
            db.commit()
            print("✓ Added last_weekly_reset column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "current_week_set" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN current_week_set VARCHAR DEFAULT 'week-set-a'"))
            db.commit()
            print("✓ Added current_week_set column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "scans_used_today" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN scans_used_today INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added scans_used_today column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "assistant_messages_today" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN assistant_messages_today INTEGER DEFAULT 0"))
            db.commit()
            print("✓ Added assistant_messages_today column to users table")

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]

        if "last_limit_reset_date" not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN last_limit_reset_date DATE"))
            db.commit()
            print("✓ Added last_limit_reset_date column to users table")

    except Exception as e:
        print(f"Error during user fields migration: {e}")
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
