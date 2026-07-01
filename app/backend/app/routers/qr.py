from typing import Any, cast

from app.db.session import SessionLocal
from app.schemas.qr import (
    QrClaimRequest,
    QrClaimResponse,
    RecyclingPointQrListResponse,
    RecyclingPointQrResponse,
    SubmitQrRecyclingRequest,
    SubmitQrRecyclingResponse,
)
from app.services.qr_service import (
    build_all_qr_zip,
    build_poster_svg,
    build_qr_png_bytes,
    build_qr_svg,
    claim_qr_reward,
    get_point_by_id,
    list_qr_points,
    submit_recycling_confirmation,
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
    items = [
        RecyclingPointQrResponse.model_validate(item) for item in list_qr_points(db)
    ]
    return RecyclingPointQrListResponse(items=items)


@router.post("/claim", response_model=QrClaimResponse)
async def claim_qr(request: QrClaimRequest, db: Session = Depends(get_db)):
    result = claim_qr_reward(db, request.user_id, request.qr_identifier)
    return QrClaimResponse.model_validate(cast(dict[str, Any], result))


@router.post("/submit", response_model=SubmitQrRecyclingResponse)
async def submit_qr_recycling(
    request: SubmitQrRecyclingRequest, db: Session = Depends(get_db)
):
    result = submit_recycling_confirmation(
        db,
        request.user_id,
        request.qr_identifier,
        request.quantities,
    )
    return SubmitQrRecyclingResponse.model_validate(cast(dict[str, Any], result))


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


@router.get("/download/{point_id}/poster.svg")
async def download_qr_poster(point_id: int, db: Session = Depends(get_db)):
    point = get_point_by_id(db, point_id)
    if not point:
        raise HTTPException(status_code=404, detail="QR point not found")
    poster_svg = build_poster_svg(point)
    poster_bytes = poster_svg.encode("utf-8")
    return Response(
        content=poster_bytes,
        media_type="image/svg+xml; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=\"poster-{point.id}.svg\"",
            "Cache-Control": "no-store",
        },
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
