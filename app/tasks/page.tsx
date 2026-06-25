"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { Task, TaskType } from "../types/tasks";
import { getProfile, ProfileResponse } from "../lib/api";

export default function TasksPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showRewardPopup, setShowRewardPopup] = useState<{ show: boolean; points: number; fading: boolean }>({ show: false, points: 0, fading: false });
  const { messages } = useLanguage();
  const { colors } = useTheme();

  useEffect(() => {
    const loadProfile = async () => {
      const userId = localStorage.getItem("qaitaJanaru_user_id");

      if (!userId) {
        router.push("/login");
        return;
      }

      try {
        const data = await getProfile(userId);
        setProfile(data);
        initializeTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const initializeTasks = (profileData: ProfileResponse) => {
    const dailyTasks: Task[] = [
      {
        id: "daily-visit",
        title: messages.tasks.taskVisitApp,
        description: messages.tasks.taskVisitAppDesc,
        reward: 5,
        target: 1,
        current: 1,
        completed: true,
        claimed: false,
        type: "daily",
        icon: "📱",
      },
      {
        id: "daily-eco",
        title: messages.tasks.taskAskEco,
        description: messages.tasks.taskAskEcoDesc,
        reward: 5,
        target: 1,
        current: 0,
        completed: false,
        claimed: false,
        type: "daily",
        icon: "🤖",
      },
      {
        id: "daily-scan",
        title: messages.tasks.taskScanWaste,
        description: messages.tasks.taskScanWasteDesc,
        reward: 5,
        target: 1,
        current: Math.min(profileData.total_scans || 0, 1),
        completed: (profileData.total_scans || 0) >= 1,
        claimed: false,
        type: "daily",
        icon: "📸",
      },
      {
        id: "daily-map",
        title: messages.tasks.taskOpenMap,
        description: messages.tasks.taskOpenMapDesc,
        reward: 5,
        target: 1,
        current: 0,
        completed: false,
        claimed: false,
        type: "daily",
        icon: "🗺️",
      },
    ];

    const weeklyTasks: Task[] = [
      {
        id: "weekly-streak",
        title: messages.tasks.taskWeeklyStreak,
        description: messages.tasks.taskWeeklyStreakDesc,
        reward: 50,
        target: 7,
        current: profileData.streak || 0,
        completed: (profileData.streak || 0) >= 7,
        claimed: false,
        type: "weekly",
        icon: "🔥",
      },
      {
        id: "weekly-eco",
        title: messages.tasks.taskWeeklyEco,
        description: messages.tasks.taskWeeklyEcoDesc,
        reward: 75,
        target: 100,
        current: profileData.eco_points || 0,
        completed: (profileData.eco_points || 0) >= 100,
        claimed: false,
        type: "weekly",
        icon: "🏆",
      },
      {
        id: "weekly-scans",
        title: messages.tasks.taskWeeklyScans,
        description: messages.tasks.taskWeeklyScansDesc,
        reward: 50,
        target: 5,
        current: Math.min(profileData.total_scans || 0, 5),
        completed: (profileData.total_scans || 0) >= 5,
        claimed: false,
        type: "weekly",
        icon: "📸",
      },
      {
        id: "weekly-questions",
        title: messages.tasks.taskWeeklyQuestions,
        description: messages.tasks.taskWeeklyQuestionsDesc,
        reward: 40,
        target: 10,
        current: 0,
        completed: false,
        claimed: false,
        type: "weekly",
        icon: "🤖",
      },
    ];

    const achievements: Task[] = [
      {
        id: "achievement-beginner",
        title: messages.tasks.achievementEcoBeginner,
        description: messages.tasks.achievementEcoBeginnerDesc,
        reward: 0,
        target: 1,
        current: 1,
        completed: true,
        claimed: true,
        type: "achievement",
        icon: "🌱",
      },
      {
        id: "achievement-first-scan",
        title: messages.tasks.achievementFirstScan,
        description: messages.tasks.achievementFirstScanDesc,
        reward: 0,
        target: 1,
        current: profileData.total_scans || 0,
        completed: (profileData.total_scans || 0) >= 1,
        claimed: true,
        type: "achievement",
        icon: "📸",
      },
      {
        id: "achievement-enthusiast",
        title: messages.tasks.achievementEcoEnthusiast,
        description: messages.tasks.achievementEcoEnthusiastDesc,
        reward: 0,
        target: 100,
        current: profileData.eco_points || 0,
        completed: (profileData.eco_points || 0) >= 100,
        claimed: true,
        type: "achievement",
        icon: "🏆",
      },
      {
        id: "achievement-hero",
        title: messages.tasks.achievementRecyclingHero,
        description: messages.tasks.achievementRecyclingHeroDesc,
        reward: 0,
        target: 500,
        current: profileData.eco_points || 0,
        completed: (profileData.eco_points || 0) >= 500,
        claimed: true,
        type: "achievement",
        icon: "♻️",
      },
      {
        id: "achievement-streak",
        title: messages.tasks.achievementStreakChampion,
        description: messages.tasks.achievementStreakChampionDesc,
        reward: 0,
        target: 7,
        current: profileData.streak || 0,
        completed: (profileData.streak || 0) >= 7,
        claimed: true,
        type: "achievement",
        icon: "🔥",
      },
      {
        id: "achievement-guardian",
        title: messages.tasks.achievementEarthGuardian,
        description: messages.tasks.achievementEarthGuardianDesc,
        reward: 0,
        target: 1000,
        current: profileData.eco_points || 0,
        completed: (profileData.eco_points || 0) >= 1000,
        claimed: true,
        type: "achievement",
        icon: "🌍",
      },
    ];

    setTasks([...dailyTasks, ...weeklyTasks, ...achievements]);
  };

  const handleClaimReward = (task: Task) => {
    if (task.claimed || !task.completed) return;

    const updatedTasks = tasks.map(t =>
      t.id === task.id ? { ...t, claimed: true } : t
    );
    setTasks(updatedTasks);

    // Update eco points in localStorage
    const currentPoints = parseInt(localStorage.getItem("qaitaJanaru_eco_points") || "0", 10);
    const newPoints = currentPoints + task.reward;
    localStorage.setItem("qaitaJanaru_eco_points", newPoints.toString());

    // Show reward popup
    setShowRewardPopup({ show: true, points: task.reward, fading: false });

    // Start fade-out after 3 seconds
    setTimeout(() => {
      setShowRewardPopup(prev => ({ ...prev, fading: true }));
      setTimeout(() => {
        setShowRewardPopup({ show: false, points: 0, fading: false });
      }, 500);
    }, 3000);
  };

  const dailyTasks = tasks.filter(t => t.type === "daily");
  const weeklyTasks = tasks.filter(t => t.type === "weekly");
  const achievements = tasks.filter(t => t.type === "achievement");

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

            {/* Achievements Section */}
            <div className="relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: "linear-gradient(to bottom right, #fbbf24, #f97316)" }}>
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{messages.tasks.achievements}</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {achievements.filter(t => t.completed).length} / {achievements.length} {messages.tasks.unlocked}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
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
