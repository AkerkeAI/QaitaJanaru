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

export interface ProfileResponse {
  user_id: number;
  full_name: string;
  email: string;
  city: string;
  user_type: string;
  institution: string;
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
  achievements: string[];
}

export interface ApiError {
  detail: string;
}

// ─── Register ──────────────────────────────────────────────────────────────────

export async function registerUser(
  data: RegisterRequest
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
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

// ─── Get Profile ───────────────────────────────────────────────────────────────

export async function getProfile(
  userId: string
): Promise<ProfileResponse> {
const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
  method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || "Failed to fetch profile");
  }

  return response.json();
}
