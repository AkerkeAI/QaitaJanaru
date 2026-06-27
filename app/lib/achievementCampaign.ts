import { AchievementChapter } from "../types/tasks";
import { ProfileResponse } from "./api";
import { TaskProgressResponse } from "./tasksApi";

function getAchievementProgress(
  achievementId: string,
  category: string,
  profile: ProfileResponse,
  taskData: TaskProgressResponse
): number {
  switch (achievementId) {
    case "achievement-first-login":
      return taskData.task_progress["daily-login"] || 0;
    case "achievement-first-scan":
      return Math.min(profile.total_scans || 0, 1);
    case "achievement-first-eco-question":
      return Math.min(taskData.task_progress["weekly-chat-10"] || 0, 1);
    case "achievement-first-recycling-visit":
      return Math.min(
        (taskData.task_progress["daily-map-1"] || 0) +
          (taskData.task_progress["daily-route-1"] || 0),
        1,
      );
    case "achievement-25-scans":
      return profile.total_scans || 0;
    case "achievement-20-questions":
      return taskData.task_progress["weekly-chat-10"] || 0;
    case "achievement-7-day-streak":
      return profile.streak || 0;
    case "achievement-complete-weekly":
      return taskData.weekly_tasks.filter((task) => task.completed).length;
    case "achievement-75-scans":
      return profile.total_scans || 0;
    case "achievement-14-day-streak":
      return profile.streak || 0;
    case "achievement-recycling-hero":
      return profile.eco_points || 0;
    case "achievement-earth-guardian":
      return profile.eco_points || 0;
    default:
      switch (category) {
        case "scan":
          return profile.total_scans || 0;
        case "points":
          return profile.eco_points || 0;
        case "streak":
          return profile.streak || 0;
        default:
          return 0;
      }
  }
}

export function buildAchievementCampaign(
  chapters: AchievementChapter[],
  profile: ProfileResponse,
  taskData: TaskProgressResponse
): AchievementChapter[] {
  let previousChapterCompleted = true;

  return chapters.map((chapter, index) => {
    const unlocked = index === 0 || previousChapterCompleted;

    const achievements = chapter.achievements.map((achievement) => {
      const rawCurrent = unlocked
        ? getAchievementProgress(achievement.id, achievement.category, profile, taskData)
        : 0;
      const current = Math.min(rawCurrent, achievement.target);

      return {
        ...achievement,
        current,
        completed: unlocked ? current >= achievement.target : false,
      };
    });

    const completed = unlocked && achievements.every((achievement) => achievement.completed);
    previousChapterCompleted = completed;

    return {
      ...chapter,
      unlocked,
      completed,
      achievements,
    };
  });
}
