"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { QrHeaderAction } from "../components/qr/QrHeaderAction";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface LeaderboardEntry {
  rank: number;
  eco_points: number;
  full_name?: string;
  city?: string;
  title?: string;
  user_id?: number;
}

type TabType = "global" | "cities";

export default function LeaderboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLanguage();
  const { colors } = useTheme();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Handle swipe to open sidebar
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

  useEffect(() => {
    const userId = localStorage.getItem("qaitaJanaru_user_id");
    if (!userId) {
      router.push("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const fetchLeaderboard = async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/leaderboard/${tab}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "global", label: messages.leaderboard.global, icon: "🌍" },
    { id: "cities", label: messages.leaderboard.cities, icon: "🏙️" },
  ];

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "";
  };

  const getName = (entry: LeaderboardEntry, tab: TabType) => {
    switch (tab) {
      case "global":
        return entry.full_name || messages.common.unknown;
      case "cities":
        return entry.city || messages.common.unknown;
      default:
        return messages.common.unknown;
    }
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
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
        {/* Header with hamburger menu */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8">
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

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {messages.common.appName}
            </h1>
          </div>

          <QrHeaderAction />
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            {/* Page Title */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                {messages.leaderboard.title}
              </h2>
              <p
                className="text-sm md:text-base"
                style={{ color: colors.textSecondary }}
              >
                {messages.leaderboard.subtitle}
              </p>
            </div>

            {/* Tabs */}
            <div
              className="relative rounded-2xl backdrop-blur-xl border shadow-xl p-2"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2`}
                    style={{
                      background:
                        activeTab === tab.id
                          ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                          : "transparent",
                      color:
                        activeTab === tab.id
                          ? colors.buttonText
                          : colors.textSecondary,
                      transform:
                        activeTab === tab.id ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Card */}
            <div
              className="relative rounded-[32px] backdrop-blur-2xl border shadow-2xl overflow-hidden"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              {/* Card gradient overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.accent})`,
                }}
              ></div>

              <div className="relative p-6 md:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mb-6"
                      style={{
                        borderColor: `${colors.primary} ${colors.primary} ${colors.primary} transparent`,
                      }}
                    ></div>
                    <p
                      className="text-lg"
                      style={{ color: colors.textSecondary }}
                    >
                      {messages.leaderboard.loading}
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="w-20 h-20 mb-6 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${colors.danger}20` }}
                    >
                      ❌
                    </div>
                    <p
                      className="text-lg mb-4"
                      style={{ color: colors.danger }}
                    >
                      {error}
                    </p>
                    <button
                      onClick={() => fetchLeaderboard(activeTab)}
                      className="px-6 py-3 rounded-xl font-bold hover:brightness-110 transition"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        color: colors.buttonText,
                      }}
                    >
                      {messages.leaderboard.retry}
                    </button>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="w-20 h-20 mb-6 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      🏆
                    </div>
                    <p
                      className="text-lg"
                      style={{ color: colors.textSecondary }}
                    >
                      {messages.leaderboard.noDataAvailable}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div
                      className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold border-b"
                      style={{
                        borderColor: colors.border,
                        color: colors.textSecondary,
                      }}
                    >
                      <div className="col-span-2 md:col-span-1">
                        {messages.leaderboard.rank}
                      </div>
                      <div className="col-span-7 md:col-span-8">
                        {messages.leaderboard.name}
                      </div>
                      <div className="col-span-3 md:col-span-3 text-right">
                        {messages.leaderboard.points}
                      </div>
                    </div>

                    {/* Leaderboard Entries */}
                    {leaderboard.map((entry, index) => {
                      const isGlobal = activeTab === "global";
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (isGlobal && entry.user_id) {
                              router.push(`/profile/${entry.user_id}`);
                            } else if (!isGlobal && entry.city) {
                              router.push(
                                `/leaderboard/city/${encodeURIComponent(entry.city)}`,
                              );
                            }
                          }}
                          className="group w-full text-left grid grid-cols-12 gap-4 px-4 py-4 rounded-2xl transition-all duration-300 hover:opacity-90 hover:scale-[1.01]"
                          style={{
                            backgroundColor:
                              entry.rank <= 3
                                ? `${colors.primary}10`
                                : "transparent",
                            borderColor:
                              entry.rank <= 3
                                ? `${colors.primary}30`
                                : "transparent",
                            borderWidth: entry.rank <= 3 ? 1 : 0,
                          }}
                        >
                          {/* Rank */}
                          <div className="col-span-2 md:col-span-1 flex items-center">
                            <div
                              className={`text-2xl font-black ${getRankStyle(entry.rank)}`}
                              style={{
                                color:
                                  entry.rank <= 3
                                    ? undefined
                                    : colors.textSecondary,
                              }}
                            >
                              {getMedal(entry.rank) || entry.rank}
                            </div>
                          </div>

                          {/* Name */}
                          <div className="col-span-7 md:col-span-8 flex items-center">
                            <div className="font-semibold text-lg truncate">
                              {getName(entry, activeTab)}
                            </div>
                          </div>

                          {/* Eco Points */}
                          <div className="col-span-3 md:col-span-3 flex items-center justify-end">
                            <div
                              className="text-xl font-black"
                              style={{
                                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {entry.eco_points}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
