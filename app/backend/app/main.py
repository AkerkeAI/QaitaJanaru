from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth
from app.routers import profile
from app.routers import leaderboard
from app.routers import scan
from app.routers import chat
from app.routers import routing

from app.db.session import Base, engine
from app.models.user import User  # noqa: F401
from app.models.scan_history import ScanHistory  # noqa: F401
from app.models.chat_message import ChatMessage  # noqa: F401

app = FastAPI()


@app.on_event("startup")
def ensure_database_tables() -> None:
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.8.23:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(leaderboard.router)
app.include_router(scan.router)
app.include_router(chat.router)
app.include_router(routing.router)

@app.get("/")
def root():
    return {"message": "QaitaJanaru API работает"}