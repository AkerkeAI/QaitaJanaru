"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext";

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
      console.log(`Leaderboard data for ${tab}:`, data);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
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
    return "text-emerald-300";
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
    <main className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-cyan-950">
      {/* Animated background orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-1000"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[80px] animate-pulse delay-500"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with hamburger menu */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 shadow-lg group"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6 text-emerald-300 group-hover:text-white transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">♻️</span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{messages.common.appName}</h1>
          </div>

          <div className="w-12"></div>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:pb-16">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            
            {/* Page Title */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{messages.leaderboard.title}</h2>
              <p className="text-emerald-300 text-sm md:text-base">{messages.leaderboard.subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 shadow-xl">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg scale-105"
                        : "text-emerald-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="relative rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Card gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10"></div>
              
              <div className="relative p-6 md:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-400 border-t-transparent mb-6"></div>
                    <p className="text-emerald-200 text-lg">{messages.leaderboard.loading}</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 mb-6 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">
                      ❌
                    </div>
                    <p className="text-red-300 text-lg mb-4">{error}</p>
                    <button
                      onClick={() => fetchLeaderboard(activeTab)}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-bold"
                    >
                      {messages.leaderboard.retry}
                    </button>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-4xl">
                      🏆
                    </div>
                    <p className="text-emerald-200 text-lg">{messages.leaderboard.noDataAvailable}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold text-emerald-300 border-b border-white/10">
                      <div className="col-span-2 md:col-span-1">{messages.leaderboard.rank}</div>
                      <div className="col-span-7 md:col-span-8">{messages.leaderboard.name}</div>
                      <div className="col-span-3 md:col-span-3 text-right">{messages.leaderboard.points}</div>
                    </div>

                    {/* Leaderboard Entries */}
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className={`group grid grid-cols-12 gap-4 px-4 py-4 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] ${
                          entry.rank <= 3
                            ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20"
                            : "bg-white/5 border border-white/5"
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-2 md:col-span-1 flex items-center">
                          <div className={`text-2xl font-black ${getRankStyle(entry.rank)}`}>
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
                          <div className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            {entry.eco_points}
                          </div>
                        </div>
                      </div>
                    ))}
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
