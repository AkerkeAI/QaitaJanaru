export type TaskType = "daily" | "weekly" | "achievement";

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
  icon: string;
}

export interface TaskProgress {
  dailyVisit: number;
  ecoAssistantQuestions: number;
  scansCompleted: number;
  recyclingMapOpens: number;
  weeklyStreak: number;
  weeklyEcoPoints: number;
}
