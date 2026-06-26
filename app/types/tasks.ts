export type TaskType = "daily" | "weekly" | "achievement" | "qr";

export type TaskCategory = "visit" | "scan" | "eco_assistant" | "map" | "profile" | "leaderboard" | "settings" | "recycling" | "streak" | "points";

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
  rotationSet?: string; // For daily/weekly rotation (e.g., "monday", "week-set-a")
  chapter?: number; // For achievements (e.g., 1, 2, 3)
  chapterTitle?: string; // For achievement chapters (e.g., "Beginner", "Intermediate")
  qrCode?: string; // For future QR tasks
  expiresAt?: Date; // For time-limited tasks
}

export interface TaskProgress {
  dailyVisit: number;
  ecoAssistantQuestions: number;
  scansCompleted: number;
  recyclingMapOpens: number;
  weeklyStreak: number;
  weeklyEcoPoints: number;
  lastDailyReset: Date;
  lastWeeklyReset: Date;
  currentWeekSet: string;
  claimedRewards: string[]; // Array of task IDs that have been claimed
}

export interface AchievementChapter {
  id: number;
  title: string;
  description: string;
  icon: string;
  requiredPoints: number;
  achievements: Task[];
  unlocked: boolean;
  completed: boolean;
}

export interface DailyTaskSet {
  weekday: number; // 0-6 (Sunday-Saturday)
  tasks: Omit<Task, "rotationSet">[];
}

export interface WeeklyTaskSet {
  id: string;
  title: string;
  tasks: Omit<Task, "rotationSet">[];
  durationWeeks: number;
}
