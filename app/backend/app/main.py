from app.db.session import Base, SessionLocal, engine
from app.models.chat_message import ChatMessage  # noqa: F401
from app.models.qr_claim import QrClaim  # noqa: F401
from app.models.recycling_point import RecyclingPoint  # noqa: F401
from app.models.recycling_submission import RecyclingSubmission  # noqa: F401
from app.models.scan_history import ScanHistory  # noqa: F401
from app.models.user import User  # noqa: F401
from app.routers import (
    auth,
    chat,
    leaderboard,
    profile,
    qr,
    recycling_points,
    routing,
    scan,
    tasks,
)
from app.services.recycling_points_seed import seed_recycling_points
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


@app.on_event("startup")
def ensure_database_tables() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_recycling_points(db)
    finally:
        db.close()


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
app.include_router(recycling_points.router)


@app.get("/")
def root():
    return {"message": "QaitaJanaru API работает"}
