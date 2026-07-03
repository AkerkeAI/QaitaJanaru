"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, ProfileResponse, updateProfile } from "../lib/api";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { QrHeaderAction } from "../components/qr/QrHeaderAction";
import { UserStatusHeader } from "../components/UserStatusHeader";
import { getStatusHeaderValues } from "../lib/profileHelpers";

const MATERIAL_ORDER = [
  "plastic_bottles",
  "glass",
  "paper",
  "metal_cans",
  "batteries",
  "electronics",
  "cardboard",
  "other_recyclable",
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakNotification, setStreakNotification] = useState<{
    show: boolean;
    streak: number;
    message: string;
    fading: boolean;
  }>({ show: false, streak: 0, message: "", fading: false });
  const [showAllActivity, setShowAllActivity] = useState(false);
  const { messages } = useLanguage();
  const { colors } = useTheme();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sidebarOpen) return;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (sidebarOpen) return;
      touchEndX.current = e.changedTouches[0].clientX;
      if (
        touchStartX.current < 30 &&
        touchEndX.current - touchStartX.current > 50
      ) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sidebarOpen]);

  const handleSaveName = async () => {
    if (!profile || !tempName.trim()) return;
    
    setSavingName(true);
    try {
      const userId = localStorage.getItem("qaitaJanaru_user_id");
      if (!userId) {
        router.push("/login");
        return;
      }
      
      const updatedProfile = await updateProfile(userId, { full_name: tempName.trim() });
      setProfile(updatedProfile);
      localStorage.setItem("qaitaJanaru_name", updatedProfile.full_name);
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setSavingName(false);
    }
  };

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

        localStorage.setItem("qaitaJanaru_name", data.full_name || "Unknown");
        localStorage.setItem("qaitaJanaru_city", data.city || "Unknown");
        localStorage.setItem(
          "qaitaJanaru_user_type",
          data.user_type || "Unknown",
        );
        localStorage.setItem(
          "qaitaJanaru_eco_points",
          String(data.eco_points || 0),
        );
        localStorage.setItem("qaitaJanaru_streak", String(data.streak || 0));
        localStorage.setItem(
          "qaitaJanaru_level",
          String(data.level),
        );
        localStorage.setItem(
          "qaitaJanaru_total_scans",
          String(data.total_scans || 0),
        );
        localStorage.setItem(
          "qaitaJanaru_institution",
          data.institution || "Unknown",
        );

        const today = new Date().toDateString();
        const lastNotificationDate = localStorage.getItem(
          "streak_notification_date",
        );

        if (data.streak && data.streak > 0 && lastNotificationDate !== today) {
          const message =
            data.streak === 1
              ? messages.profile.streakNotification1Day
              : messages.profile.streakNotificationXDays.replace(
                  "{count}",
                  String(data.streak),
                );

          setTimeout(() => {
            setStreakNotification({
              show: true,
              streak: data.streak,
              message,
              fading: false,
            });
            localStorage.setItem("streak_notification_date", today);

            setTimeout(() => {
              setStreakNotification((prev) => ({ ...prev, fading: true }));
              setTimeout(() => {
                setStreakNotification({
                  show: false,
                  streak: 0,
                  message,
                  fading: false,
                });
              }, 500);
            }, 4500);
          }, 500);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : messages.profile.errorDescription,
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [
    router,
    messages.profile.errorDescription,
    messages.profile.streakNotification1Day,
    messages.profile.streakNotificationXDays,
  ]);

  const materialLabelMap = useMemo(
    () => ({
      plastic_bottles: messages.profile.plasticBottles,
      glass: messages.profile.glass,
      paper: messages.profile.paper,
      metal_cans: messages.profile.metalCans,
      batteries: messages.profile.batteries,
      electronics: messages.profile.electronics,
      cardboard: messages.profile.cardboard,
      other_recyclable: messages.profile.otherRecyclable,
    }),
    [messages.profile],
  );

  const materials = useMemo(() => {
    if (!profile) return [];
    const source = new Map(
      profile.analytics.materials.map((item) => [item.key, item.quantity]),
    );
    return MATERIAL_ORDER.map((key) => ({
      key,
      quantity: source.get(key) || 0,
      label: materialLabelMap[key],
    })).filter((item) => item.quantity > 0);
  }, [materialLabelMap, profile]);

  const totalMaterialQuantity = materials.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const recentActivity = useMemo(() => {
    if (!profile) return [];
    return profile.analytics.recent_activity.map((item) => ({
      ...item,
      materialLabel:
        materialLabelMap[item.material as keyof typeof materialLabelMap] ||
        item.material,
      formattedDate: new Date(item.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [materialLabelMap, profile]);

  const visibleRecentActivity = showAllActivity
    ? recentActivity
    : recentActivity.slice(0, 3);

  if (loading) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6"
            style={{
              borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent`,
            }}
          />
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            {messages.profile.loading}
          </p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: colors.bg, color: colors.text }}
      >
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">{messages.profile.error}</h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            {error || messages.profile.errorDescription}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              color: colors.buttonText,
            }}
          >
            {messages.profile.loginAgain}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse"
        style={{ backgroundColor: `${colors.primary}20` }}
      />
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse delay-1000"
        style={{ backgroundColor: `${colors.accent}20` }}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-500"
        style={{ backgroundColor: `${colors.primary}10` }}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl backdrop-blur-xl border hover:scale-105 transition-all duration-300 shadow-lg group"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
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

          <UserStatusHeader {...getStatusHeaderValues(profile)} />

          <QrHeaderAction />
        </header>

        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
            <div
              className="relative rounded-[32px] backdrop-blur-2xl border shadow-2xl overflow-hidden"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                }}
              />

              <div className="relative p-6 md:p-8 lg:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  <div className="relative shrink-0">
                    <div
                      className="w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] shadow-2xl"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-5xl md:text-6xl backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(to bottom right, ${colors.primaryDark}, ${colors.primary})`,
                        }}
                      >
                        🌱
                      </div>
                    </div>
                    <div
                      className="absolute -bottom-2 -right-2 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg border-4"
                      style={{
                        background:
                          "linear-gradient(to bottom right, #fbbf24, #f97316)",
                        borderColor: colors.primaryDark,
                      }}
                    >
                      {profile.level}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      {isEditingName ? (
                        <>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveName();
                              } else if (e.key === "Escape") {
                                setIsEditingName(false);
                                setTempName(profile.full_name);
                              }
                            }}
                            className="text-3xl md:text-4xl font-bold tracking-tight bg-transparent border-b-2 border-current outline-none"
                            style={{ color: colors.text }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="p-1 rounded-full hover:bg-white/10 transition"
                            style={{ color: colors.primary }}
                          >
                            ✔️
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setTempName(profile.full_name);
                            }}
                            disabled={savingName}
                            className="p-1 rounded-full hover:bg-white/10 transition"
                            style={{ color: colors.textSecondary }}
                          >
                            ✖️
                          </button>
                        </>
                      ) : (
                        <>
                          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            {profile.full_name}
                          </h2>
                          <button
                            onClick={() => {
                              setTempName(profile.full_name);
                              setIsEditingName(true);
                            }}
                            className="p-1 rounded-full hover:bg-white/10 transition"
                            style={{ color: colors.textSecondary }}
                          >
                            ✏️
                          </button>
                        </>
                      )}
                    </div>
                    <div
                      className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4"
                      style={{ color: colors.textSecondary }}
                    >
                      <span
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colors.primary}10`,
                          borderColor: colors.border,
                        }}
                      >
                        📍 {profile.city}
                      </span>
                      {profile.institution ? (
                        <span
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
                          style={{
                            backgroundColor: `${colors.primary}10`,
                            borderColor: colors.border,
                          }}
                        >
                          🏫 {profile.institution}
                        </span>
                      ) : null}
                    </div>
                    {profile.user_type ? (
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}20, ${colors.accent}20)`,
                          borderColor: `${colors.primary}40`,
                        }}
                      >
                        <span className="text-lg">💼</span>
                        <span className="font-medium capitalize">
                          {profile.user_type}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-center md:text-right">
                    <div
                      className="text-4xl md:text-5xl font-black"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {profile.eco_points}
                    </div>
                    <div
                      className="text-sm md:text-base font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {messages.profile.ecoPoints}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  label: messages.profile.totalRecyclingActions,
                  value: profile.analytics.total_recycling_actions,
                  icon: "♻️",
                },
                {
                  label: messages.profile.totalEcoPointsEarned,
                  value: profile.analytics.total_eco_points_earned,
                  icon: "🌱",
                },
                {
                  label: messages.profile.streak,
                  value: profile.streak,
                  icon: "🔥",
                },
                {
                  label: messages.profile.level,
                  value: profile.level,
                  icon: "⭐",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl p-5 md:p-6 backdrop-blur-xl border shadow-xl"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }}
                >
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="text-3xl font-bold mb-1">{item.value}</div>
                  <div
                    className="text-sm leading-snug"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section
                className="rounded-3xl p-6 md:p-8 border shadow-2xl"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-6 gap-4">
                  <h3 className="text-2xl font-bold">
                    {messages.profile.materialsRecycled}
                  </h3>
                  <span
                    className="text-sm px-3 py-1 rounded-full border"
                    style={{
                      color: colors.textSecondary,
                      borderColor: colors.border,
                    }}
                  >
                    {profile.analytics.total_recycling_actions}{" "}
                    {messages.profile.submissionCount}
                  </span>
                </div>
                <div className="space-y-3">
                  {materials.length > 0 ? (
                    materials.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
                        style={{ borderColor: colors.border }}
                      >
                        <span className="font-medium break-words">
                          {item.label}
                        </span>
                        <span
                          className="text-xl font-bold"
                          style={{ color: colors.primary }}
                        >
                          {item.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: colors.textSecondary }}>
                      {messages.profile.noRecentActivity}
                    </p>
                  )}
                </div>
              </section>

              <section
                className="rounded-3xl p-6 md:p-8 border shadow-2xl"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                <h3 className="text-2xl font-bold mb-6">
                  {messages.profile.recyclingDistribution}
                </h3>
                <div className="space-y-4">
                  {materials.length > 0 ? (
                    materials.map((item) => {
                      const percentage =
                        totalMaterialQuantity > 0
                          ? Math.round(
                              (item.quantity / totalMaterialQuantity) * 100,
                            )
                          : 0;
                      return (
                        <div key={item.key} className="space-y-2">
                          <div className="flex items-center justify-between gap-4 text-sm md:text-base">
                            <span className="font-medium break-words">
                              {item.label}
                            </span>
                            <span style={{ color: colors.textSecondary }}>
                              {percentage}%
                            </span>
                          </div>
                          <div
                            className="h-3 rounded-full overflow-hidden"
                            style={{ backgroundColor: `${colors.text}12` }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: colors.textSecondary }}>
                      {messages.profile.noRecentActivity}
                    </p>
                  )}
                </div>
              </section>
            </div>

            <section
              className="rounded-3xl p-6 md:p-8 border shadow-2xl"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold">
                    {messages.profile.recentActivity}
                  </h3>
                  <p style={{ color: colors.textSecondary }}>
                    {messages.profile.recyclingSummary}
                  </p>
                </div>
                <div
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {messages.profile.levelProgress}: {profile.level_progress_percent}%
                </div>
              </div>

              {/* Level Progress Bar */}
              <div className="mb-6">
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${colors.text}12` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${profile.level_progress_percent}%`,
                      background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  visibleRecentActivity.map((activity, index) => (
                    <div
                      key={`${activity.id}-${activity.material}-${index}`}
                      className="rounded-2xl border p-4 md:p-5"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
                        <div>
                          <div
                            className="text-xs uppercase tracking-wide"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.profile.date}
                          </div>
                          <div className="font-semibold">
                            {activity.formattedDate}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs uppercase tracking-wide"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.profile.recyclingPoint}
                          </div>
                          <div className="font-semibold break-words">
                            {activity.recycling_point_name}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs uppercase tracking-wide"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.profile.material}
                          </div>
                          <div className="font-semibold break-words">
                            {activity.materialLabel}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs uppercase tracking-wide"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.profile.quantity}
                          </div>
                          <div className="font-semibold">
                            {activity.quantity}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs uppercase tracking-wide"
                            style={{ color: colors.textSecondary }}
                          >
                            {messages.profile.ecoPointsEarned}
                          </div>
                          <div
                            className="font-semibold"
                            style={{ color: colors.primary }}
                          >
                            +{activity.eco_points_awarded}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: colors.border,
                      color: colors.textSecondary,
                    }}
                  >
                    {messages.profile.noRecentActivity}
                  </div>
                )}
              </div>

              {recentActivity.length > 3 && !showAllActivity ? (
                <button
                  type="button"
                  onClick={() => setShowAllActivity(true)}
                  className="mt-5 w-full md:w-auto px-5 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    color: colors.buttonText,
                  }}
                >
                  {messages.profile.showAllActivity}
                </button>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {streakNotification.show && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ${streakNotification.fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
        >
          <div
            className="px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
          >
            <div className="font-semibold">🔥 {streakNotification.message}</div>
          </div>
        </div>
      )}
    </main>
  );
}
