from typing import List

from pydantic import BaseModel


class PartnerQrAdminItemResponse(BaseModel):
    id: int
    qr_identifier: str
    is_reserved: bool
    is_assigned: bool
    branch_id: int | None = None
    partner_name: str | None = None
    branch_name: str | None = None
    city: str | None = None
    address: str | None = None
    qr_url: str
    qr_value: str
    qr_svg: str


class PartnerQrAdminListResponse(BaseModel):
    items: List[PartnerQrAdminItemResponse]


class PartnerQrRewardResponse(BaseModel):
    id: str
    title: str
    description: str
    eco_points_required: int
    image: str
    category_id: str


class PartnerQrBranchPageResponse(BaseModel):
    qr_identifier: str
    partner_name: str
    branch_name: str
    city: str
    address: str
    instagram: str
    working_hours: str
    lat: float | None = None
    lng: float | None = None
    rewards: List[PartnerQrRewardResponse]


class PartnerQrExchangeRequest(BaseModel):
    user_id: int
    qr_identifier: str
    reward_id: str


class PartnerQrReceiptResponse(BaseModel):
    receipt_id: str
    exchange_id: int
    partner_name: str
    branch_name: str
    reward_title: str
    price_eco_points: int
    eco_points_balance: int
    issued_at: str
    expires_at: str
    used_at: str | None = None
    is_expired: bool
    is_used: bool
    is_valid: bool
    message: str
