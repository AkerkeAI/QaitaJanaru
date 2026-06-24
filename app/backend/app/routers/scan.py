from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
import traceback

from app.db.session import SessionLocal
from app.models.scan_history import ScanHistory
from app.models.user import User
from app.schemas.scan import ScanResponse
from app.services.ai_waste_detector import AIProviderError, analyze_waste_image
from app.services.reward_service import points_for_waste
from app.services.user_service import add_eco_points

router = APIRouter(prefix="/scan", tags=["Scan"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _map_ai_error(exc: AIProviderError) -> HTTPException:
    if exc.code == "INVALID_IMAGE":
        return HTTPException(status_code=400, detail=exc.args[0])
    if exc.code == "AI_TIMEOUT":
        return HTTPException(status_code=504, detail=exc.args[0])
    if exc.code == "AI_PROVIDER_QUOTA":
        return HTTPException(
            status_code=503,
            detail="AI service is temporarily unavailable due to provider limits. Please try again later.",
        )
    return HTTPException(status_code=503, detail=exc.args[0])


@router.post("/{user_id}", response_model=ScanResponse)
async def scan_waste(user_id: int, file: UploadFile = File(...), language: str = "en", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload an image.")

    try:
        image_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Invalid image file")

    try:
        print("SCAN REQUEST")
        print("user_id:", user_id)
        print("user.total_scans:", user.total_scans or 0)
        print("file_size:", len(image_bytes))
        print("language:", language)
        result = analyze_waste_image(image_bytes, language)
        print("AI RESULT:", result)
    except AIProviderError as exc:
        print("AI provider error:", exc.code, exc.args[0])
        raise _map_ai_error(exc) from exc
    except Exception as exc:
        print("Unexpected error during scan:", exc)
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Please try again.",
        ) from exc

    earned_points = points_for_waste(result["waste_type"])
    user.total_scans = (user.total_scans or 0) + 1
    user = add_eco_points(db, user, earned_points)

    scan_record = ScanHistory(
        user_id=user.id,
        waste_type=result["waste_type"],
        category=result["category"],
        confidence=result["confidence"],
        eco_tip=result["eco_tip"],
        recycling_advice=result["recycling_advice"],
        earned_points=earned_points,
        timestamp=datetime.utcnow(),
    )
    try:
        db.add(scan_record)
        db.commit()
    except Exception as exc:
        db.rollback()
        print("Failed to persist scan history:", exc)
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="Scan completed but history could not be saved. Please try again.",
        ) from exc

    return {
        "waste_type": result["waste_type"],
        "category": result["category"],
        "recycling_category": result["recycling_category"],
        "confidence": result["confidence"],
        "eco_tip": result["eco_tip"],
        "recycling_advice": result["recycling_advice"],
        "preparation_steps": result["preparation_steps"],
        "recyclable": result["recyclable"],
        "earned_points": earned_points,
        "new_total_points": user.eco_points,
    }
