const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  type: "daily" | "weekly" | "achievement" | "qr";
  category: string;
  icon: string;
}

export interface TaskProgressResponse {
  task_progress: Record<string, number>;
  claimed_rewards: string[];
  last_daily_reset: string | null;
  last_weekly_reset: string | null;
  daily_tasks: TaskItem[];
  weekly_tasks: TaskItem[];
}

export interface ClaimRewardResponse {
  success: boolean;
  eco_points: number;
  message: string;
}

export async function getTaskProgress(
  userId: string,
): Promise<TaskProgressResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/task-progress/${userId}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch task progress");
  }

  return response.json();
}

export async function claimReward(
  userId: string,
  taskId: string,
): Promise<ClaimRewardResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/claim-reward/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task_id: taskId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to claim reward");
  }

  return response.json();
}

export async function registerTaskEvent(
  userId: string,
  event: "map_visit" | "route_open",
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/event/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event }),
  });

  if (!response.ok) {
    throw new Error("Failed to register task event");
  }

  return response.json();
}

export async function resetDailyTasks(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/reset-daily/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to reset daily tasks");
  }

  return response.json();
}

export async function resetWeeklyTasks(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/reset-weekly/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to reset weekly tasks");
  }

  return response.json();
}
