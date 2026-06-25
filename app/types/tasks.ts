export type TaskType = "daily" | "weekly" | "achievement";
export type TaskCategory = "app_usage" | "scanning" | "eco_assistant" | "social" | "progression" | "qr_recycling" | "custom";

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  type: TaskType;
  category: TaskCategory;
  icon: string;
  weekday?: number; // 0-6 for daily rotation (Sunday = 0)
  weekSet?: string; // 'A', 'B', 'C' for weekly rotation
  chapter?: number; // Chapter number for achievements
  chapterOrder?: number; // Order within chapter
  qrCode?: string; // For future QR recycling tasks
  expiresAt?: Date; // For time-limited tasks
}

export interface TaskProgress {
  dailyVisit: number;
  ecoAssistantQuestions: number;
  scansCompleted: number;
  recyclingMapOpens: number;
  weeklyStreak: number;
  weeklyEcoPoints: number;
  completedTasks: string[]; // IDs of completed tasks
  claimedRewards: string[]; // IDs of claimed rewards
  lastDailyReset: Date;
  lastWeeklyReset: Date;
  currentWeekSet: string;
}

export interface AchievementChapter {
  id: number;
  title: string;
  description: string;
  icon: string;
  requiredTasks: string[]; // Task IDs required to complete chapter
  unlocked: boolean;
  unlockDate?: Date;
}
