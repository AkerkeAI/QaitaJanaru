const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TaskProgressResponse {
  task_progress: Record<string, number>;
  claimed_rewards: string[];
  last_daily_reset: string | null;
  last_weekly_reset: string | null;
  current_week_set: string;
}

export interface ClaimRewardResponse {
  success: boolean;
  eco_points: number;
  message: string;
}

export async function getTaskProgress(token: string): Promise<TaskProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/task-progress`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task progress");
  }

  return response.json();
}

export async function updateTaskProgress(
  token: string,
  taskId: string,
  progress: number
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/task-progress/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ task_id: taskId, progress }),
  });

  if (!response.ok) {
    throw new Error("Failed to update task progress");
  }

  return response.json();
}

export async function claimReward(
  token: string,
  taskId: string
): Promise<ClaimRewardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/claim-reward`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  if (!response.ok) {
    throw new Error("Failed to claim reward");
  }

  return response.json();
}

export async function resetDailyTasks(
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/reset-daily`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to reset daily tasks");
  }

  return response.json();
}

export async function resetWeeklyTasks(
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/reset-weekly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to reset weekly tasks");
  }

  return response.json();
}
