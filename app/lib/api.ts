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

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  type: string;
  category: string;
  icon: string;
  weekday?: number;
  weekSet?: string;
  chapter?: number;
  chapterOrder?: number;
}

export interface TasksResponse {
  daily_tasks: Task[];
  weekly_tasks: Task[];
  achievements: Task[];
  eco_points: number;
  level: number;
  streak: number;
  total_scans: number;
}

export interface ClaimRewardResponse {
  message: string;
  reward: number;
  new_eco_points: number;
  new_level: number;
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
    const errorCode = error.detail;
    throw new Error(ERROR_CODE_MAP[errorCode] || errorCode || "Registration failed");
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
    const errorCode = error.detail;
    throw new Error(ERROR_CODE_MAP[errorCode] || errorCode || "Login failed");
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
    const errorCode = error.detail;
    throw new Error(ERROR_CODE_MAP[errorCode] || errorCode || "Failed to fetch profile");
  }

  return response.json();
}

// ─── Get Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(userId: string): Promise<TasksResponse> {
  const response = await fetch(`${API_URL}/tasks/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || "Failed to fetch tasks");
  }

  return response.json();
}

// ─── Claim Reward ───────────────────────────────────────────────────────────────

export async function claimReward(userId: string, taskId: string): Promise<ClaimRewardResponse> {
  const response = await fetch(`${API_URL}/tasks/${userId}/claim/${taskId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || "Failed to claim reward");
  }

  return response.json();
}

// ─── Complete Task ───────────────────────────────────────────────────────────────

export async function completeTask(userId: string, taskId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/tasks/${userId}/complete/${taskId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || "Failed to complete task");
  }

  return response.json();
}
