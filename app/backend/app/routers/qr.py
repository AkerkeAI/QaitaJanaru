from app.db.session import SessionLocal
from app.models.recycling_point import RecyclingPoint
from app.schemas.qr import (
    QrClaimRequest,
    QrClaimResponse,
    RecyclingPointQrListResponse,
    RecyclingPointQrResponse,
)
from app.services.qr_service import (
    build_all_qr_zip,
    build_qr_png_bytes,
    build_qr_svg,
    claim_qr_reward,
    get_point_by_id,
    list_qr_points,
)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/qr", tags=["qr"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/points", response_model=RecyclingPointQrListResponse)
async def get_qr_points(db: Session = Depends(get_db)):
    return RecyclingPointQrListResponse(
        items=[RecyclingPointQrResponse(**item) for item in list_qr_points(db)]
    )


@router.post("/claim", response_model=QrClaimResponse)
async def claim_qr(request: QrClaimRequest, db: Session = Depends(get_db)):
    result = claim_qr_reward(db, request.user_id, request.qr_identifier)
    return QrClaimResponse(**result)


@router.get("/download/{point_id}.svg")
async def download_qr_svg(point_id: int, db: Session = Depends(get_db)):
    point = get_point_by_id(db, point_id)
    if not point:
        raise HTTPException(status_code=404, detail="QR point not found")
    svg = build_qr_svg(point)
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f"attachment; filename=qr-{point.id}.svg"},
    )


@router.get("/download/{point_id}.png")
async def download_qr_png(point_id: int, db: Session = Depends(get_db)):
    point = get_point_by_id(db, point_id)
    if not point:
        raise HTTPException(status_code=404, detail="QR point not found")
    png_bytes = build_qr_png_bytes(point)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=qr-{point.id}.png"},
    )


@router.get("/download/all.zip")
async def download_all_qrs(db: Session = Depends(get_db)):
    archive = build_all_qr_zip(db)
    return Response(
        content=archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=qaita-janaru-qr-codes.zip"
        },
    )
