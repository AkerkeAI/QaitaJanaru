const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  city: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user_id: number;
  eco_points: number;
  streak: number;
}

export interface RecyclingMaterialStatsResponse {
  key: string;
  quantity: number;
}

export interface RecentRecyclingActivityResponse {
  id: number;
  created_at: string;
  recycling_point_name: string;
  material: string;
  quantity: number;
  eco_points_awarded: number;
}

export interface RecyclingAnalyticsResponse {
  total_recycling_actions: number;
  total_eco_points_earned: number;
  materials: RecyclingMaterialStatsResponse[];
  recent_activity: RecentRecyclingActivityResponse[];
}

export interface ProfileResponse {
  id: number;
  full_name: string;
  email: string;
  city: string;
  user_type: string;
  institution: string;
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
  achievements?: string[];
  analytics: RecyclingAnalyticsResponse;
}

export interface ApiError {
  detail: string;
}

// ─── Error Code Mapping ─────────────────────────────────────────────────────────

const ERROR_CODE_MAP: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INCORRECT_PASSWORD: "INCORRECT_PASSWORD",
};

// ─── Register ──────────────────────────────────────────────────────────────────

export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    const errorCode = error.detail;
    throw new Error(
      ERROR_CODE_MAP[errorCode] || errorCode || "Registration failed",
    );
  }

  return response.json();
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    const errorCode = error.detail;
    throw new Error(ERROR_CODE_MAP[errorCode] || errorCode || "Login failed");
  }

  return response.json();
}

// ─── Get Profile ───────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_URL}/profile/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    const errorCode = error.detail;
    throw new Error(
      ERROR_CODE_MAP[errorCode] || errorCode || "Failed to fetch profile",
    );
  }

  return response.json();
}
