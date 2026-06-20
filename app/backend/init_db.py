"""Create missing database tables for QaitaJanaru backend."""
from app.db.session import Base, engine
from app.models.user import User  # noqa: F401
from app.models.scan_history import ScanHistory  # noqa: F401
from app.models.chat_message import ChatMessage  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured:", ", ".join(sorted(Base.metadata.tables.keys())))


if __name__ == "__main__":
    init_db()
