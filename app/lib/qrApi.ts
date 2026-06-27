const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface QrPointItem {
  id: number;
  qr_identifier: string;
  name: string;
  city: string;
  address: string;
  waste_type: string;
  facility_type: string;
  qr_url: string;
  qr_value: string;
  qr_svg: string;
}

export interface QrPointsResponse {
  items: QrPointItem[];
}

export interface QrClaimResponse {
  success: boolean;
  message: string;
  recycling_point_id: number | null;
  recycling_point_name: string | null;
  qr_identifier: string | null;
  points_awarded: number;
  eco_points: number;
  task_rewards: number;
  total_reward: number;
}

export async function getQrPoints(): Promise<QrPointsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/qr/points`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch QR points");
  }
  return response.json();
}

export async function claimQrReward(userId: string, qrIdentifier: string): Promise<QrClaimResponse> {
  const response = await fetch(`${API_BASE_URL}/api/qr/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: Number(userId),
      qr_identifier: qrIdentifier,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to claim QR reward");
  }

  return response.json();
}

export function getQrSvgDownloadUrl(pointId: number): string {
  return `${API_BASE_URL}/api/qr/download/${pointId}.svg`;
}

export function getQrPngDownloadUrl(pointId: number): string {
  return `${API_BASE_URL}/api/qr/download/${pointId}.png`;
}

export function getQrZipDownloadUrl(): string {
  return `${API_BASE_URL}/api/qr/download/all.zip`;
}
