const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PartnerQrAdminItem {
  id: number;
  qr_identifier: string;
  is_reserved: boolean;
  is_assigned: boolean;
  branch_id: number | null;
  partner_name: string | null;
  branch_name: string | null;
  city: string | null;
  address: string | null;
  qr_url: string;
  qr_value: string;
  qr_svg: string;
}

export interface PartnerQrAdminResponse {
  items: PartnerQrAdminItem[];
}

export interface PartnerQrRewardItem {
  id: string;
  title: string;
  description: string;
  eco_points_required: number;
  image: string;
  category_id: string;
}

export interface PartnerQrBranchResponse {
  qr_identifier: string;
  partner_name: string;
  branch_name: string;
  city: string;
  address: string;
  instagram: string;
  working_hours: string;
  lat: number | null;
  lng: number | null;
  rewards: PartnerQrRewardItem[];
}

export interface PartnerQrReceiptResponse {
  receipt_id: string;
  exchange_id: number;
  partner_name: string;
  branch_name: string;
  reward_title: string;
  price_eco_points: number;
  eco_points_balance: number;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  is_expired: boolean;
  is_used: boolean;
  is_valid: boolean;
  message: string;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail || "PARTNER_QR_REQUEST_FAILED";
  } catch {
    return "PARTNER_QR_REQUEST_FAILED";
  }
}

export async function getPartnerQrCodes(): Promise<PartnerQrAdminResponse> {
  const response = await fetch(`${API_BASE_URL}/api/partner-qr/codes`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function getPartnerQrBranch(
  qrIdentifier: string,
): Promise<PartnerQrBranchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/partner-qr/public/${encodeURIComponent(qrIdentifier)}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function exchangePartnerQrReward(
  userId: string,
  qrIdentifier: string,
  rewardId: string,
): Promise<PartnerQrReceiptResponse> {
  const response = await fetch(`${API_BASE_URL}/api/partner-qr/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: Number(userId),
      qr_identifier: qrIdentifier,
      reward_id: rewardId,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function getPartnerQrReceipt(
  receiptId: string,
  userId: string,
): Promise<PartnerQrReceiptResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/partner-qr/receipt/${encodeURIComponent(receiptId)}?user_id=${encodeURIComponent(userId)}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export function getPartnerQrSvgDownloadUrl(codeId: number): string {
  return `${API_BASE_URL}/api/partner-qr/download/${codeId}.svg`;
}

export function getPartnerQrPosterDownloadUrl(codeId: number): string {
  return `${API_BASE_URL}/api/partner-qr/download/${codeId}/poster.png`;
}

export function getPartnerQrPngDownloadUrl(codeId: number): string {
  return `${API_BASE_URL}/api/partner-qr/download/${codeId}.png`;
}

export function getPartnerQrZipDownloadUrl(): string {
  return `${API_BASE_URL}/api/partner-qr/download/all.zip`;
}
