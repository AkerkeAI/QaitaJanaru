from app.db.session import SessionLocal
from app.schemas.partner_qr import (
    PartnerQrAdminItemResponse,
    PartnerQrAdminListResponse,
    PartnerQrBranchPageResponse,
    PartnerQrExchangeRequest,
    PartnerQrReceiptResponse,
)
from app.services.partner_qr_service import (
    build_all_partner_qr_zip,
    build_partner_qr_png_bytes,
    build_partner_qr_poster_png_bytes,
    build_partner_qr_svg,
    exchange_partner_reward,
    get_partner_qr_branch_details,
    get_partner_qr_code_by_id,
    get_partner_qr_receipt,
    list_partner_qr_codes,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/partner-qr", tags=["partner-qr"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/codes", response_model=PartnerQrAdminListResponse)
async def get_partner_qr_codes(db: Session = Depends(get_db)):
    items = [
        PartnerQrAdminItemResponse.model_validate(item)
        for item in list_partner_qr_codes(db)
    ]
    return PartnerQrAdminListResponse(items=items)


@router.get("/download/{code_id}.svg")
async def download_partner_qr_svg(code_id: int, db: Session = Depends(get_db)):
    code = get_partner_qr_code_by_id(db, code_id)
    if not code:
        raise HTTPException(status_code=404, detail="PARTNER_QR_NOT_FOUND")
    svg = build_partner_qr_svg(code)
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Content-Disposition": f"attachment; filename=partner-qr-{code.id}.svg"
        },
    )


@router.get("/download/{code_id}.png")
async def download_partner_qr_png(code_id: int, db: Session = Depends(get_db)):
    code = get_partner_qr_code_by_id(db, code_id)
    if not code:
        raise HTTPException(status_code=404, detail="PARTNER_QR_NOT_FOUND")
    png_bytes = build_partner_qr_png_bytes(code)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=partner-qr-{code.id}.png"
        },
    )


@router.get("/download/{code_id}/poster.png")
async def download_partner_qr_poster_png(code_id: int, db: Session = Depends(get_db)):
    code = get_partner_qr_code_by_id(db, code_id)
    if not code:
        raise HTTPException(status_code=404, detail="PARTNER_QR_NOT_FOUND")
    poster_png = build_partner_qr_poster_png_bytes(code)
    return Response(
        content=poster_png,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=\"partner-poster-{code.id}.png\"",
            "Cache-Control": "no-store",
        },
    )


@router.get("/download/{code_id}/poster.svg")
async def redirect_partner_qr_poster_svg(code_id: int):
    return RedirectResponse(url=f"/api/partner-qr/download/{code_id}/poster.png")


@router.get("/download/all.zip")
async def download_all_partner_qrs(db: Session = Depends(get_db)):
    archive = build_all_partner_qr_zip(db)
    return Response(
        content=archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=qaita-janaru-partner-qr-codes.zip"
        },
    )


@router.get("/public/{qr_identifier}", response_model=PartnerQrBranchPageResponse)
async def get_partner_qr_public_page(
    qr_identifier: str, db: Session = Depends(get_db)
):
    page_data = get_partner_qr_branch_details(db, qr_identifier)
    if not page_data:
        raise HTTPException(status_code=404, detail="PARTNER_QR_NOT_FOUND")
    return PartnerQrBranchPageResponse.model_validate(page_data)


@router.post("/exchange", response_model=PartnerQrReceiptResponse)
async def create_partner_qr_exchange(
    request: PartnerQrExchangeRequest, db: Session = Depends(get_db)
):
    try:
        payload = exchange_partner_reward(
            db,
            user_id=request.user_id,
            qr_identifier=request.qr_identifier,
            reward_id=request.reward_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return PartnerQrReceiptResponse.model_validate(payload)


@router.get("/receipt/{receipt_id}", response_model=PartnerQrReceiptResponse)
async def get_partner_receipt(
    receipt_id: str,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        payload = get_partner_qr_receipt(db, receipt_id=receipt_id, user_id=user_id)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error

    if not payload:
        raise HTTPException(status_code=404, detail="PARTNER_QR_RECEIPT_NOT_FOUND")

    return PartnerQrReceiptResponse.model_validate(payload)
