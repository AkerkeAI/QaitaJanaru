const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RecyclingPoint {
  id: number;
  qr_identifier: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  waste_type: string;
  facility_type:
    | "Collection Point"
    | "Sorting Station"
    | "Recycling Plant"
    | "Hazardous Disposal"
    | string;
  qr_url: string;
}

export interface RecyclingPointsResponse {
  items: RecyclingPoint[];
  total: number;
}

export async function getRecyclingPoints(): Promise<RecyclingPointsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/recycling-points`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recycling points");
  }

  return response.json();
}
