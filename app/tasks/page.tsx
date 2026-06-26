"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { Task, AchievementChapter } from "../types/tasks";
import { getProfile, ProfileResponse } from "../lib/api";
import { getTaskProgress, claimReward } from "../lib/tasksApi";
import { getDailyTasksForWeekday, getWeeklyTasksForSet, achievementChapters } from "../lib/taskConfig";

export default function TasksPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([]);
  const [chapters, setChapters] = useState<AchievementChapter[]>(achievementChapters);
  const [showRewardPopup, setShowRewardPopup] = useState<{ show: boolean; points: number; fading: boolean }>({ show: false, points: 0, fading: false });
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [currentWeekSet, setCurrentWeekSet] = useState<string>("week-set-a");
  const { messages } = useLanguage();
  const { colors } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      const token = localStorage.getItem("qaitaJanaru_token");

      if (!userId || !token) {
        router.push("/login");
        return;
      }

      try {
        // Load profile data
        const profileData = await getProfile(userId);
        setProfile(profileData);

        // Load task progress from backend
        const progressData = await getTaskProgress(token);
        setTaskProgress(progressData.task_progress || {});
        setClaimedRewards(progressData.claimed_rewards || []);
        setCurrentWeekSet(progressData.current_week_set || "week-set-a");

        // Initialize tasks based on current weekday and week set
        const currentWeekday = new Date().getDay();
        const dailyTasksData = getDailyTasksForWeekday(currentWeekday);
        const weeklyTasksData = getWeeklyTasksForSet(progressData.current_week_set || "week-set-a");

        // Update task progress from backend
        const updatedDailyTasks = dailyTasksData.map(task => ({
          ...task,
          current: progressData.task_progress?.[task.id] || 0,
          completed: (progressData.task_progress?.[task.id] || 0) >= task.target,
          claimed: progressData.claimed_rewards?.includes(task.id) || false,
        }));

        const updatedWeeklyTasks = weeklyTasksData.map(task => ({
          ...task,
          current: progressData.task_progress?.[task.id] || 0,
          completed: (progressData.task_progress?.[task.id] || 0) >= task.target,
          claimed: progressData.claimed_rewards?.includes(task.id) || false,
        }));

        setDailyTasks(updatedDailyTasks);
        setWeeklyTasks(updatedWeeklyTasks);

        // Update achievement chapters based on profile data
        const updatedChapters = achievementChapters.map(chapter => {
          const updatedAchievements = chapter.achievements.map(achievement => {
            let current = 0;
            switch (achievement.category) {
              case "scan":
                current = profileData.total_scans || 0;
                break;
              case "points":
                current = profileData.eco_points || 0;
                break;
              case "streak":
                current = profileData.streak || 0;
                break;
              default:
                current = 0;
            }
            return {
              ...achievement,
              current,
              completed: current >= achievement.target,
            };
          });

          const allCompleted = updatedAchievements.every(a => a.completed);
          const unlocked = chapter.id === 1 || 
            (chapter.id > 1 && achievementChapters[chapter.id - 2].completed);

          return {
            ...chapter,
            achievements: updatedAchievements,
            unlocked,
            completed: allCompleted,
          };
        });

        setChapters(updatedChapters);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleClaimReward = async (task: Task) => {
    if (task.claimed || !task.completed) return;

    const token = localStorage.getItem("qaitaJanaru_token");
    if (!token) return;

    try {
      const result = await claimReward(token, task.id);
      
      if (result.success) {
        // Update local state
        setClaimedRewards(prev => [...prev, task.id]);
        
        // Update tasks
        const updateTaskList = (tasks: Task[]) => 
          tasks.map(t => t.id === task.id ? { ...t, claimed: true } : t);
        
        setDailyTasks(updateTaskList);
        setWeeklyTasks(updateTaskList);

        // Update profile eco points
        if (profile) {
          setProfile({ ...profile, eco_points: result.eco_points });
        }

        // Show reward popup
        setShowRewardPopup({ show: true, points: task.reward, fading: false });

        // Start fade-out after 3 seconds
        setTimeout(() => {
          setShowRewardPopup(prev => ({ ...prev, fading: true }));
          setTimeout(() => {
            setShowRewardPopup({ show: false, points: 0, fading: false });
          }, 500);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to claim reward:", err);
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const progress = Math.min(task.current / task.target, 1);
    const canClaim = task.completed && !task.claimed && task.type !== "achievement";

    return (
      <div
        className={`group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
          task.completed ? "" : "opacity-90"
        }`}
        style={{
          backgroundColor: task.completed ? `${colors.primary}15` : colors.cardBg,
          borderColor: task.completed ? `${colors.primary}40` : colors.border,
          borderWidth: 1,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${
              task.completed ? "animate-bounce" : ""
            }`}
            style={{
              background: task.completed
                ? "linear-gradient(to bottom right, #fbbf24, #f97316)"
                : task.type === "achievement"
                ? "linear-gradient(to bottom right, #a855f7, #ec4899)"
                : "linear-gradient(to bottom right, #4b5563, #374151)",
            }}
          >
            {task.completed && task.type !== "achievement" ? "✓" : task.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-lg truncate">{task.title}</h4>
              {task.reward > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                  <span>+</span>
                  <span>{task.reward}</span>
                  <span>{messages.tasks.points}</span>
                </div>
              )}
            </div>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
              {task.description}
            </p>

            {task.type !== "achievement" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
                  <span>{task.current} / {task.target}</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text}10` }}>
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    }}
                  />
                </div>
              </div>
            )}

            {canClaim && (
              <button
                onClick={() => handleClaimReward(task)}
                className="mt-3 w-full py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                  color: colors.buttonText,
                }}
              >
                {messages.tasks.claim} {task.reward} {messages.tasks.points}
              </button>
            )}

            {task.claimed && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                <span>✓</span>
                <span>{messages.tasks.claimed}</span>
              </div>
            )}

            {!task.completed && task.type === "achievement" && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.text}10`, color: colors.textSecondary }}>
                <span>🔒</span>
                <span>{messages.tasks.locked}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6" style={{ borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent` }}></div>
          <p className="text-lg" style={{ color: colors.textSecondary }}>{messages.profile.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: colors.bg, color: colors.text }}>
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">{messages.profile.error}</h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>{error || messages.profile.errorDescription}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition"
            style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`, color: colors.buttonText }}
          >
            {messages.profile.loginAgain}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
      {/* Animated background orbs */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ backgroundColor: `${colors.primary}20` }}
      ></div>
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse delay-1000"
        style={{ backgroundColor: `${colors.accent}20` }}
      ></div>
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-500"
        style={{ backgroundColor: `${colors.primary}10` }}
      ></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke={colors.textSecondary}
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">📋</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.tasks.title}</h1>
          </div>

          <div className="w-12"></div>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            
            {/* Daily Tasks Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})` }}>
                  📅
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{messages.tasks.dailyTasks}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {dailyTasks.filter(t => t.completed).length} / {dailyTasks.length} {messages.tasks.completed}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dailyTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Weekly Tasks Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: "linear-gradient(to bottom right, #a855f7, #ec4899)" }}>
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{messages.tasks.weeklyTasks}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {weeklyTasks.filter(t => t.completed).length} / {weeklyTasks.length} {messages.tasks.completed}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {weeklyTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

            {/* Achievements Section with Chapters */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: "linear-gradient(to bottom right, #fbbf24, #f97316)" }}>
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{messages.tasks.achievements}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {chapters.filter(c => c.completed).length} / {chapters.length} {messages.tasks.chapterComplete}
                  </p>
                </div>
              </div>

              {/* Chapter Navigation */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    disabled={!chapter.unlocked}
                    className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                      chapter.unlocked
                        ? "hover:scale-105 active:scale-95"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    style={{
                      background: chapter.unlocked
                        ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                        : "linear-gradient(to right, #4b5563, #374151)",
                      color: chapter.unlocked ? colors.buttonText : "#9ca3af",
                    }}
                  >
                    {messages.tasks.chapter} {chapter.id}
                  </button>
                ))}
              </div>

              {/* Chapter Content */}
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`rounded-2xl p-5 transition-all ${
                      !chapter.unlocked ? "opacity-50" : ""
                    }`}
                    style={{
                      backgroundColor: chapter.unlocked ? `${colors.primary}10` : `${colors.text}5`,
                      borderColor: chapter.unlocked ? `${colors.primary}30` : colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: chapter.unlocked ? "linear-gradient(to bottom right, #fbbf24, #f97316)" : "linear-gradient(to bottom right, #4b5563, #374151)" }}>
                        {chapter.unlocked ? chapter.icon : "🔒"}
                      </div>
                      <div>
                        <h4 className="font-bold">{chapter.title}</h4>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{chapter.description}</p>
                      </div>
                      {chapter.completed && (
                        <div className="ml-auto px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                          ✓ {messages.tasks.chapterComplete}
                        </div>
                      )}
                      {!chapter.unlocked && (
                        <div className="ml-auto px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors.text}10`, color: colors.textSecondary }}>
                          {messages.tasks.chapterLocked}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {chapter.achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`rounded-xl p-3 transition-all ${
                            achievement.completed ? "" : "opacity-70"
                          }`}
                          style={{
                            backgroundColor: achievement.completed ? `${colors.primary}15` : colors.cardBg,
                            borderColor: achievement.completed ? `${colors.primary}30` : colors.border,
                            borderWidth: 1,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{achievement.completed ? achievement.icon : "🔒"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{achievement.title}</div>
                              <div className="text-xs" style={{ color: colors.textSecondary }}>{achievement.current} / {achievement.target}</div>
                            </div>
                            {achievement.completed && (
                              <span className="text-xs" style={{ color: colors.primary }}>✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Tasks Coming Soon */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: "linear-gradient(to bottom right, #6366f1, #8b5cf6)" }}>
                  📱
                </div>
                <div>
                  <h3 className="text-xl font-bold">QR Recycling Tasks</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{messages.tasks.qrTasksComingSoon}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: `${colors.text}5` }}>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Coming soon: Recycle plastic bottles, electronics, and more by scanning QR codes at recycling centers!
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Reward Popup */}
      {showRewardPopup.show && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90%] max-w-sm ${showRewardPopup.fading ? 'opacity-0 scale-95 transition-all duration-500' : 'opacity-100 scale-100 transition-all duration-500'}`}>
          <div 
            className="px-6 py-6 rounded-3xl shadow-2xl text-center backdrop-blur-2xl border-2"
            style={{ 
              background: `rgba(255,255,255,0.1)`, 
              borderColor: `${colors.primary}40`, 
              color: colors.text 
            }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-2xl font-bold mb-2">{messages.tasks.congrats}</div>
            <div className="text-lg mb-1">{messages.tasks.youEarned}</div>
            <div className="text-3xl font-black" style={{ color: colors.primary }}>
              +{showRewardPopup.points} {messages.tasks.points}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
