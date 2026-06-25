from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth
from app.routers import profile
from app.routers import leaderboard
from app.routers import scan
from app.routers import chat
from app.routers import routing
from app.routers import tasks

from app.db.session import Base, engine
from app.models.user import User  # noqa: F401
from app.models.scan_history import ScanHistory  # noqa: F401
from app.models.chat_message import ChatMessage  # noqa: F401
from app.models.task_progress import TaskProgress  # noqa: F401

app = FastAPI(
    title="QaitaJanaru Backend TEST 12345"
)


@app.on_event("startup")
def ensure_database_tables() -> None:
    Base.metadata.create_all(bind=engine)


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
app.include_router(tasks.router)

@app.get("/")
def root():
    return {"message": "QaitaJanaru API работает"}