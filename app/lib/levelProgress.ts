export const LEVEL_SCORE_PER_LEVEL = 100;

export interface LevelProfileInput {
  total_scans?: number;
  streak?: number;
  eco_points?: number;
  task_progress?: Record<string, number>;
}

interface AchievementDefinition {
  id: string;
  target: number;
  chapter: number;
  progress: (profile: LevelProfileInput) => number;
}

const WEEKLY_TASK_TARGETS: Record<string, number> = {
  "weekly-scan-15": 15,
  "weekly-scan-30": 30,
  "weekly-earn-300": 300,
  "weekly-streak-5": 5,
  "weekly-chat-10": 10,
  "weekly-route-5": 5,
};

function taskProgress(profile: LevelProfileInput, taskId: string): number {
  return Number(profile.task_progress?.[taskId] ?? 0);
}

function countCompletedWeeklyTasks(profile: LevelProfileInput): number {
  return Object.entries(WEEKLY_TASK_TARGETS).reduce((count, [taskId, target]) => {
    return taskProgress(profile, taskId) >= target ? count + 1 : count;
  }, 0);
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "achievement-first-login",
    target: 1,
    chapter: 1,
    progress: (profile) => Math.min(taskProgress(profile, "daily-login"), 1),
  },
  {
    id: "achievement-first-scan",
    target: 1,
    chapter: 1,
    progress: (profile) => Math.min(profile.total_scans ?? 0, 1),
  },
  {
    id: "achievement-first-eco-question",
    target: 1,
    chapter: 1,
    progress: (profile) => Math.min(taskProgress(profile, "weekly-chat-10"), 1),
  },
  {
    id: "achievement-first-recycling-visit",
    target: 1,
    chapter: 1,
    progress: (profile) =>
      Math.min(
        taskProgress(profile, "daily-map-1") +
          taskProgress(profile, "daily-route-1"),
        1,
      ),
  },
  {
    id: "achievement-25-scans",
    target: 25,
    chapter: 2,
    progress: (profile) => profile.total_scans ?? 0,
  },
  {
    id: "achievement-20-questions",
    target: 20,
    chapter: 2,
    progress: (profile) => taskProgress(profile, "weekly-chat-10"),
  },
  {
    id: "achievement-7-day-streak",
    target: 7,
    chapter: 2,
    progress: (profile) => profile.streak ?? 0,
  },
  {
    id: "achievement-complete-weekly",
    target: 3,
    chapter: 2,
    progress: (profile) => countCompletedWeeklyTasks(profile),
  },
  {
    id: "achievement-75-scans",
    target: 75,
    chapter: 3,
    progress: (profile) => profile.total_scans ?? 0,
  },
  {
    id: "achievement-14-day-streak",
    target: 14,
    chapter: 3,
    progress: (profile) => profile.streak ?? 0,
  },
  {
    id: "achievement-recycling-hero",
    target: 500,
    chapter: 3,
    progress: (profile) => profile.eco_points ?? 0,
  },
  {
    id: "achievement-earth-guardian",
    target: 1000,
    chapter: 3,
    progress: (profile) => profile.eco_points ?? 0,
  },
];

export function countCompletedAchievements(profile: LevelProfileInput): number {
  const chapters = [1, 2, 3];
  let completedCount = 0;
  let previousChapterCompleted = true;

  for (const chapter of chapters) {
    const chapterAchievements = ACHIEVEMENT_DEFINITIONS.filter(
      (achievement) => achievement.chapter === chapter,
    );
    const unlocked = chapter === 1 || previousChapterCompleted;

    if (!unlocked) {
      break;
    }

    let chapterComplete = true;
    for (const achievement of chapterAchievements) {
      const current = Math.min(achievement.progress(profile), achievement.target);
      const completed = current >= achievement.target;
      if (completed) {
        completedCount += 1;
      } else {
        chapterComplete = false;
      }
    }

    previousChapterCompleted = chapterComplete;
    if (!chapterComplete) {
      break;
    }
  }

  return completedCount;
}

export function computeLevelScore(profile: LevelProfileInput): number {
  const totalScans = profile.total_scans ?? 0;
  const streak = profile.streak ?? 0;
  const achievements = countCompletedAchievements(profile);

  return totalScans * 3 + streak * 5 + achievements * 25;
}

export function deriveLevelFromProfile(
  profile: LevelProfileInput,
  fallbackLevel?: number,
): number {
  const score = computeLevelScore(profile);
  if (score === 0 && fallbackLevel) {
    return Math.max(1, fallbackLevel);
  }
  return Math.max(1, Math.floor(score / LEVEL_SCORE_PER_LEVEL) + 1);
}

export function getLevelProgress(profile: LevelProfileInput) {
  const score = computeLevelScore(profile);
  const currentXP = score % LEVEL_SCORE_PER_LEVEL;
  return {
    score,
    currentXP,
    levelProgress: currentXP / LEVEL_SCORE_PER_LEVEL,
    pointsToNextLevel: LEVEL_SCORE_PER_LEVEL - currentXP,
  };
}
